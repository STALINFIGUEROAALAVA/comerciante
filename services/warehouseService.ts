import { query } from "../db/client.ts";

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  location?: string;
  active: boolean;
  created_at: Date;
}

export async function getAllWarehouses(): Promise<Warehouse[]> {
  const result = await query("SELECT * FROM warehouses WHERE active = true ORDER BY name");
  return result.rows as Warehouse[];
}

export async function getWarehouseById(id: number): Promise<Warehouse | null> {
  const result = await query("SELECT * FROM warehouses WHERE id = $1", [id]);
  return result.rows[0] as Warehouse || null;
}

export async function createWarehouse(data: {
  code: string;
  name: string;
  location?: string;
}): Promise<Warehouse> {
  const result = await query(
    "INSERT INTO warehouses (code, name, location) VALUES ($1, $2, $3) RETURNING *",
    [data.code, data.name, data.location || null]
  );
  return result.rows[0] as Warehouse;
}

export async function updateWarehouse(id: number, data: {
  code?: string;
  name?: string;
  location?: string;
}): Promise<Warehouse | null> {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (data.code !== undefined) {
    fields.push(`code = $${paramIndex++}`);
    values.push(data.code);
  }
  if (data.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.location !== undefined) {
    fields.push(`location = $${paramIndex++}`);
    values.push(data.location);
  }

  if (fields.length === 0) return await getWarehouseById(id);

  values.push(id);

  const result = await query(
    `UPDATE warehouses SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] as Warehouse || null;
}

export async function getStockByWarehouse(warehouseId: number) {
  const result = await query(
    `SELECT s.*, p.code as product_code, p.name as product_name, p.unit 
     FROM stock s
     JOIN products p ON s.product_id = p.id
     WHERE s.warehouse_id = $1 AND p.active = true
     ORDER BY p.name`,
    [warehouseId]
  );
  return result.rows;
}

export async function getStockByProduct(productId: number, warehouseId: number) {
  const result = await query(
    "SELECT * FROM stock WHERE product_id = $1 AND warehouse_id = $2",
    [productId, warehouseId]
  );
  return result.rows[0] || null;
}
