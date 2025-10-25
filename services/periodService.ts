import { query } from "../db/client.ts";

export interface InventoryPeriod {
  id: number;
  period_name: string;
  start_date: Date;
  end_date: Date;
  status: "open" | "closed";
  closed_by?: number;
  closed_at?: Date;
  notes?: string;
  created_at: Date;
}

export async function getAllPeriods(): Promise<InventoryPeriod[]> {
  const result = await query("SELECT * FROM inventory_periods ORDER BY start_date DESC");
  return result.rows as InventoryPeriod[];
}

export async function getPeriodById(id: number): Promise<InventoryPeriod | null> {
  const result = await query("SELECT * FROM inventory_periods WHERE id = $1", [id]);
  return result.rows[0] as InventoryPeriod || null;
}

export async function createPeriod(data: {
  period_name: string;
  start_date: Date;
  end_date: Date;
  notes?: string;
}): Promise<InventoryPeriod> {
  const result = await query(
    "INSERT INTO inventory_periods (period_name, start_date, end_date, notes) VALUES ($1, $2, $3, $4) RETURNING *",
    [data.period_name, data.start_date, data.end_date, data.notes || null]
  );
  return result.rows[0] as InventoryPeriod;
}

export async function closePeriod(id: number, userId: number, notes?: string): Promise<InventoryPeriod | null> {
  const result = await query(
    "UPDATE inventory_periods SET status = 'closed', closed_by = $1, closed_at = CURRENT_TIMESTAMP, notes = $2 WHERE id = $3 RETURNING *",
    [userId, notes || null, id]
  );
  return result.rows[0] as InventoryPeriod || null;
}

export async function isDateInClosedPeriod(date: Date): Promise<boolean> {
  const result = await query(
    "SELECT COUNT(*) as count FROM inventory_periods WHERE status = 'closed' AND $1 BETWEEN start_date AND end_date",
    [date]
  );
  const count = (result.rows[0] as { count: number }).count;
  return count > 0;
}

export async function validateOpenPeriod(date: Date): Promise<void> {
  const inClosedPeriod = await isDateInClosedPeriod(date);
  if (inClosedPeriod) {
    throw new Error("Cannot perform operations on dates within closed periods");
  }
}
