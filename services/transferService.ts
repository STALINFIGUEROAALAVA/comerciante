import pool, { query } from "../db/client.ts";
import { validateOpenPeriod } from "./periodService.ts";
import { recordStockLedgerEntry } from "./cost.ts";

export interface Transfer {
  id: number;
  transfer_number: string;
  from_warehouse_id: number;
  to_warehouse_id: number;
  transfer_date: Date;
  status: string;
  notes?: string;
  created_by?: number;
  created_at: Date;
  completed_at?: Date;
}

export interface TransferItem {
  id: number;
  transfer_id: number;
  product_id: number;
  quantity: number;
}

export async function getAllTransfers(): Promise<Transfer[]> {
  const result = await query(
    `SELECT t.*, 
      wf.name as from_warehouse_name, 
      wt.name as to_warehouse_name
     FROM warehouse_transfers t
     JOIN warehouses wf ON t.from_warehouse_id = wf.id
     JOIN warehouses wt ON t.to_warehouse_id = wt.id
     ORDER BY t.created_at DESC`
  );
  return result.rows as Transfer[];
}

export async function getTransferById(id: number) {
  const result = await query(
    `SELECT t.*, 
      wf.name as from_warehouse_name, 
      wt.name as to_warehouse_name
     FROM warehouse_transfers t
     JOIN warehouses wf ON t.from_warehouse_id = wf.id
     JOIN warehouses wt ON t.to_warehouse_id = wt.id
     WHERE t.id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) return null;
  
  const transfer = result.rows[0];
  
  const itemsResult = await query(
    `SELECT ti.*, p.code as product_code, p.name as product_name, p.unit
     FROM transfer_items ti
     JOIN products p ON ti.product_id = p.id
     WHERE ti.transfer_id = $1`,
    [id]
  );
  
  return {
    ...transfer,
    items: itemsResult.rows
  };
}

export async function createTransfer(data: {
  from_warehouse_id: number;
  to_warehouse_id: number;
  transfer_date: Date;
  items: Array<{ product_id: number; quantity: number }>;
  notes?: string;
  created_by: number;
}): Promise<Transfer> {
  // Validate period is open
  await validateOpenPeriod(data.transfer_date);

  if (data.from_warehouse_id === data.to_warehouse_id) {
    throw new Error("Source and destination warehouses must be different");
  }

  const client = await pool.connect();
  
  try {
    await client.queryArray("BEGIN");

    // Generate transfer number
    const transferNumber = `TRF-${Date.now()}`;

    // Create transfer
    const transferResult = await client.queryObject(
      `INSERT INTO warehouse_transfers 
       (transfer_number, from_warehouse_id, to_warehouse_id, transfer_date, notes, created_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING *`,
      [transferNumber, data.from_warehouse_id, data.to_warehouse_id, data.transfer_date, data.notes || null, data.created_by]
    );

    const transfer = transferResult.rows[0] as Transfer;

    // Insert items
    for (const item of data.items) {
      await client.queryObject(
        "INSERT INTO transfer_items (transfer_id, product_id, quantity) VALUES ($1, $2, $3)",
        [transfer.id, item.product_id, item.quantity]
      );
    }

    await client.queryArray("COMMIT");
    return transfer;
  } catch (error) {
    await client.queryArray("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function completeTransfer(transferId: number): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.queryArray("BEGIN");

    // Get transfer details
    const transferResult = await client.queryObject(
      "SELECT * FROM warehouse_transfers WHERE id = $1",
      [transferId]
    );

    if (transferResult.rows.length === 0) {
      throw new Error("Transfer not found");
    }

    const transfer = transferResult.rows[0] as Transfer;

    if (transfer.status !== "pending") {
      throw new Error("Transfer is not pending");
    }

    // Validate period
    await validateOpenPeriod(transfer.transfer_date);

    // Get transfer items
    const itemsResult = await client.queryObject(
      "SELECT * FROM transfer_items WHERE transfer_id = $1",
      [transferId]
    );

    const items = itemsResult.rows as TransferItem[];

    // Process each item
    for (const item of items) {
      // Check stock availability in source warehouse
      const stockResult = await client.queryObject(
        "SELECT quantity FROM stock WHERE product_id = $1 AND warehouse_id = $2",
        [item.product_id, transfer.from_warehouse_id]
      );

      const currentStock = stockResult.rows[0] 
        ? (stockResult.rows[0] as { quantity: number }).quantity
        : 0;

      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.product_id}`);
      }

      // Update source warehouse stock
      await client.queryObject(
        `INSERT INTO stock (product_id, warehouse_id, quantity)
         VALUES ($1, $2, -$3)
         ON CONFLICT (product_id, warehouse_id)
         DO UPDATE SET quantity = stock.quantity - $3`,
        [item.product_id, transfer.from_warehouse_id, item.quantity]
      );

      // Update destination warehouse stock
      await client.queryObject(
        `INSERT INTO stock (product_id, warehouse_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (product_id, warehouse_id)
         DO UPDATE SET quantity = stock.quantity + $3`,
        [item.product_id, transfer.to_warehouse_id, item.quantity]
      );

      // Record ledger entries (using temp connection for these)
      const avgCostResult = await client.queryObject(
        `SELECT 
          CASE 
            WHEN SUM(quantity) = 0 THEN 0
            ELSE SUM(value_change) / SUM(quantity)
          END as avg_cost
         FROM stock_ledger
         WHERE product_id = $1 AND warehouse_id = $2
         AND transaction_type IN ('purchase', 'adjustment_increase', 'transfer_in')`,
        [item.product_id, transfer.from_warehouse_id]
      );

      const avgCost = avgCostResult.rows[0] 
        ? (avgCostResult.rows[0] as { avg_cost: number | null }).avg_cost || 0
        : 0;

      // Ledger entry for source (transfer out)
      await client.queryObject(
        `INSERT INTO stock_ledger 
         (product_id, warehouse_id, transaction_type, transaction_date, reference_type, reference_id,
          quantity, unit_cost, value_change, balance_quantity)
         VALUES ($1, $2, 'transfer_out', $3, 'transfer', $4, -$5, $6, -$7,
          (SELECT COALESCE(quantity, 0) FROM stock WHERE product_id = $1 AND warehouse_id = $2))`,
        [item.product_id, transfer.from_warehouse_id, transfer.transfer_date, 
         transferId, item.quantity, avgCost, item.quantity * avgCost]
      );

      // Ledger entry for destination (transfer in)
      await client.queryObject(
        `INSERT INTO stock_ledger 
         (product_id, warehouse_id, transaction_type, transaction_date, reference_type, reference_id,
          quantity, unit_cost, value_change, balance_quantity)
         VALUES ($1, $2, 'transfer_in', $3, 'transfer', $4, $5, $6, $7,
          (SELECT COALESCE(quantity, 0) FROM stock WHERE product_id = $1 AND warehouse_id = $2))`,
        [item.product_id, transfer.to_warehouse_id, transfer.transfer_date,
         transferId, item.quantity, avgCost, item.quantity * avgCost]
      );
    }

    // Mark transfer as completed
    await client.queryObject(
      "UPDATE warehouse_transfers SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = $1",
      [transferId]
    );

    await client.queryArray("COMMIT");
  } catch (error) {
    await client.queryArray("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
