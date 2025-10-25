import pool, { query } from "../db/client.ts";
import { validateOpenPeriod } from "./periodService.ts";
import { recordStockLedgerEntry } from "./cost.ts";

export interface Adjustment {
  id: number;
  adjustment_number: string;
  warehouse_id: number;
  adjustment_type: "increase" | "decrease";
  status: "PENDING" | "APPROVED" | "REJECTED";
  effective_at: Date;
  reason?: string;
  submitted_by?: number;
  submitted_at: Date;
  reviewed_by?: number;
  reviewed_at?: Date;
  review_notes?: string;
}

export interface AdjustmentItem {
  id: number;
  adjustment_id: number;
  product_id: number;
  quantity: number;
  unit_cost?: number;
  notes?: string;
}

export async function getAllAdjustments(): Promise<Adjustment[]> {
  const result = await query(
    `SELECT a.*, 
      w.name as warehouse_name,
      u1.username as submitted_by_username,
      u2.username as reviewed_by_username
     FROM inventory_adjustments a
     JOIN warehouses w ON a.warehouse_id = w.id
     LEFT JOIN users u1 ON a.submitted_by = u1.id
     LEFT JOIN users u2 ON a.reviewed_by = u2.id
     ORDER BY a.submitted_at DESC`
  );
  return result.rows as Adjustment[];
}

export async function getAdjustmentById(id: number) {
  const result = await query(
    `SELECT a.*, 
      w.name as warehouse_name,
      u1.username as submitted_by_username,
      u2.username as reviewed_by_username
     FROM inventory_adjustments a
     JOIN warehouses w ON a.warehouse_id = w.id
     LEFT JOIN users u1 ON a.submitted_by = u1.id
     LEFT JOIN users u2 ON a.reviewed_by = u2.id
     WHERE a.id = $1`,
    [id]
  );
  
  if (result.rows.length === 0) return null;
  
  const adjustment = result.rows[0];
  
  const itemsResult = await query(
    `SELECT ai.*, p.code as product_code, p.name as product_name, p.unit
     FROM adjustment_items ai
     JOIN products p ON ai.product_id = p.id
     WHERE ai.adjustment_id = $1`,
    [id]
  );
  
  return {
    ...adjustment,
    items: itemsResult.rows
  };
}

export async function createAdjustment(data: {
  warehouse_id: number;
  adjustment_type: "increase" | "decrease";
  effective_at: Date;
  reason?: string;
  items: Array<{ product_id: number; quantity: number; unit_cost?: number; notes?: string }>;
  submitted_by: number;
}): Promise<Adjustment> {
  const client = await pool.connect();
  
  try {
    await client.queryArray("BEGIN");

    // Generate adjustment number
    const adjustmentNumber = `ADJ-${Date.now()}`;

    // Create adjustment
    const adjustmentResult = await client.queryObject(
      `INSERT INTO inventory_adjustments 
       (adjustment_number, warehouse_id, adjustment_type, effective_at, reason, submitted_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'PENDING') RETURNING *`,
      [adjustmentNumber, data.warehouse_id, data.adjustment_type, data.effective_at, data.reason || null, data.submitted_by]
    );

    const adjustment = adjustmentResult.rows[0] as Adjustment;

    // Insert items
    for (const item of data.items) {
      await client.queryObject(
        "INSERT INTO adjustment_items (adjustment_id, product_id, quantity, unit_cost, notes) VALUES ($1, $2, $3, $4, $5)",
        [adjustment.id, item.product_id, item.quantity, item.unit_cost || null, item.notes || null]
      );
    }

    await client.queryArray("COMMIT");
    return adjustment;
  } catch (error) {
    await client.queryArray("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function approveAdjustment(
  adjustmentId: number,
  reviewedBy: number,
  reviewNotes?: string
): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.queryArray("BEGIN");

    // Get adjustment details
    const adjustmentResult = await client.queryObject(
      "SELECT * FROM inventory_adjustments WHERE id = $1",
      [adjustmentId]
    );

    if (adjustmentResult.rows.length === 0) {
      throw new Error("Adjustment not found");
    }

    const adjustment = adjustmentResult.rows[0] as Adjustment;

    if (adjustment.status !== "PENDING") {
      throw new Error("Adjustment is not pending");
    }

    // Validate period is open
    await validateOpenPeriod(adjustment.effective_at);

    // Get adjustment items
    const itemsResult = await client.queryObject(
      "SELECT * FROM adjustment_items WHERE adjustment_id = $1",
      [adjustmentId]
    );

    const items = itemsResult.rows as AdjustmentItem[];

    // Process each item
    for (const item of items) {
      const quantityChange = adjustment.adjustment_type === "increase" 
        ? item.quantity 
        : -item.quantity;

      // For decreases, check stock availability
      if (adjustment.adjustment_type === "decrease") {
        const stockResult = await client.queryObject(
          "SELECT quantity FROM stock WHERE product_id = $1 AND warehouse_id = $2",
          [item.product_id, adjustment.warehouse_id]
        );

        const currentStock = stockResult.rows[0] 
          ? (stockResult.rows[0] as { quantity: number }).quantity
          : 0;

        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.product_id}`);
        }
      }

      // Update stock
      await client.queryObject(
        `INSERT INTO stock (product_id, warehouse_id, quantity)
         VALUES ($1, $2, $3)
         ON CONFLICT (product_id, warehouse_id)
         DO UPDATE SET quantity = stock.quantity + $3`,
        [item.product_id, adjustment.warehouse_id, quantityChange]
      );

      // Record ledger entry at effective_at date
      const transactionType = adjustment.adjustment_type === "increase" 
        ? "adjustment_increase" 
        : "adjustment_decrease";

      const unitCost = item.unit_cost || 0;
      const valueChange = adjustment.adjustment_type === "increase"
        ? item.quantity * unitCost
        : -(item.quantity * unitCost);

      await client.queryObject(
        `INSERT INTO stock_ledger 
         (product_id, warehouse_id, transaction_type, transaction_date, reference_type, reference_id,
          quantity, unit_cost, value_change, balance_quantity, notes)
         VALUES ($1, $2, $3, $4, 'adjustment', $5, $6, $7, $8,
          (SELECT COALESCE(quantity, 0) FROM stock WHERE product_id = $1 AND warehouse_id = $2),
          $9)`,
        [
          item.product_id, adjustment.warehouse_id, transactionType, adjustment.effective_at,
          adjustmentId, quantityChange, unitCost, valueChange, item.notes || null
        ]
      );
    }

    // Mark adjustment as approved
    await client.queryObject(
      "UPDATE inventory_adjustments SET status = 'APPROVED', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP, review_notes = $2 WHERE id = $3",
      [reviewedBy, reviewNotes || null, adjustmentId]
    );

    await client.queryArray("COMMIT");
  } catch (error) {
    await client.queryArray("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function rejectAdjustment(
  adjustmentId: number,
  reviewedBy: number,
  reviewNotes?: string
): Promise<void> {
  // Get adjustment
  const adjustment = await getAdjustmentById(adjustmentId);
  
  if (!adjustment) {
    throw new Error("Adjustment not found");
  }

  if (adjustment.status !== "PENDING") {
    throw new Error("Adjustment is not pending");
  }

  // Mark as rejected
  await query(
    "UPDATE inventory_adjustments SET status = 'REJECTED', reviewed_by = $1, reviewed_at = CURRENT_TIMESTAMP, review_notes = $2 WHERE id = $3",
    [reviewedBy, reviewNotes || null, adjustmentId]
  );
}
