import { query } from "../db/client.ts";

export interface StockMovement {
  transaction_date: Date;
  transaction_type: string;
  quantity: number;
  unit_cost?: number;
  value_change?: number;
  balance_quantity: number;
}

export async function calculateMovingAverageCost(
  productId: number,
  warehouseId: number,
  cutoffDate?: Date
): Promise<number> {
  const whereClause = cutoffDate 
    ? "WHERE product_id = $1 AND warehouse_id = $2 AND transaction_date <= $3"
    : "WHERE product_id = $1 AND warehouse_id = $2";
  
  const params = cutoffDate 
    ? [productId, warehouseId, cutoffDate]
    : [productId, warehouseId];

  const result = await query(
    `SELECT 
      CASE 
        WHEN SUM(quantity) = 0 THEN 0
        ELSE SUM(value_change) / SUM(quantity)
      END as avg_cost
     FROM stock_ledger
     ${whereClause}
     AND transaction_type IN ('purchase', 'adjustment_increase', 'transfer_in')`,
    params
  );

  const row = result.rows[0] as { avg_cost: number | null };
  return row?.avg_cost || 0;
}

export async function getValuationReport(
  cutoffDate?: Date,
  warehouseId?: number
): Promise<Array<{
  product_id: number;
  product_code: string;
  product_name: string;
  warehouse_id: number;
  warehouse_name: string;
  quantity: number;
  avg_cost: number;
  total_value: number;
}>> {
  let whereClause = "WHERE p.active = true";
  const params: unknown[] = [];
  let paramIndex = 1;

  if (cutoffDate) {
    whereClause += ` AND sl.transaction_date <= $${paramIndex}`;
    params.push(cutoffDate);
    paramIndex++;
  }

  if (warehouseId) {
    whereClause += ` AND s.warehouse_id = $${paramIndex}`;
    params.push(warehouseId);
    paramIndex++;
  }

  const result = await query(
    `SELECT 
      p.id as product_id,
      p.code as product_code,
      p.name as product_name,
      w.id as warehouse_id,
      w.name as warehouse_name,
      COALESCE(s.quantity, 0) as quantity,
      COALESCE(
        (SELECT 
          CASE 
            WHEN SUM(sl2.quantity) = 0 THEN 0
            ELSE SUM(sl2.value_change) / SUM(sl2.quantity)
          END
         FROM stock_ledger sl2
         WHERE sl2.product_id = p.id 
           AND sl2.warehouse_id = w.id
           AND sl2.transaction_type IN ('purchase', 'adjustment_increase', 'transfer_in')
           ${cutoffDate ? `AND sl2.transaction_date <= $1` : ''}
        ), 0
      ) as avg_cost,
      COALESCE(s.quantity, 0) * COALESCE(
        (SELECT 
          CASE 
            WHEN SUM(sl2.quantity) = 0 THEN 0
            ELSE SUM(sl2.value_change) / SUM(sl2.quantity)
          END
         FROM stock_ledger sl2
         WHERE sl2.product_id = p.id 
           AND sl2.warehouse_id = w.id
           AND sl2.transaction_type IN ('purchase', 'adjustment_increase', 'transfer_in')
           ${cutoffDate ? `AND sl2.transaction_date <= $1` : ''}
        ), 0
      ) as total_value
    FROM products p
    CROSS JOIN warehouses w
    LEFT JOIN stock s ON s.product_id = p.id AND s.warehouse_id = w.id
    LEFT JOIN stock_ledger sl ON sl.product_id = p.id AND sl.warehouse_id = w.id
    ${whereClause}
    GROUP BY p.id, p.code, p.name, w.id, w.name, s.quantity
    HAVING COALESCE(s.quantity, 0) > 0
    ORDER BY p.name, w.name`,
    params
  );

  return result.rows as Array<{
    product_id: number;
    product_code: string;
    product_name: string;
    warehouse_id: number;
    warehouse_name: string;
    quantity: number;
    avg_cost: number;
    total_value: number;
  }>;
}

export async function recordStockLedgerEntry(
  productId: number,
  warehouseId: number,
  transactionType: string,
  transactionDate: Date,
  quantity: number,
  unitCost: number | null,
  referenceType?: string,
  referenceId?: number,
  notes?: string
): Promise<void> {
  // Calculate value change
  const valueChange = unitCost ? quantity * unitCost : 0;

  // Get current balance
  const balanceResult = await query(
    "SELECT COALESCE(quantity, 0) as quantity FROM stock WHERE product_id = $1 AND warehouse_id = $2",
    [productId, warehouseId]
  );
  const currentBalance = balanceResult.rows[0] 
    ? (balanceResult.rows[0] as { quantity: number }).quantity 
    : 0;

  // Insert ledger entry
  await query(
    `INSERT INTO stock_ledger 
     (product_id, warehouse_id, transaction_type, transaction_date, reference_type, reference_id, 
      quantity, unit_cost, value_change, balance_quantity, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      productId, warehouseId, transactionType, transactionDate,
      referenceType || null, referenceId || null,
      quantity, unitCost, valueChange, currentBalance + quantity, notes || null
    ]
  );
}
