import { query } from "../db/client.ts";

export interface Product {
  id: number;
  code: string;
  name: string;
  description?: string;
  unit: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function getAllProducts(): Promise<Product[]> {
  const result = await query("SELECT * FROM products WHERE active = true ORDER BY name");
  return result.rows as Product[];
}

export async function getProductById(id: number): Promise<Product | null> {
  const result = await query("SELECT * FROM products WHERE id = $1", [id]);
  return result.rows[0] as Product || null;
}

export async function createProduct(data: {
  code: string;
  name: string;
  description?: string;
  unit: string;
}): Promise<Product> {
  const result = await query(
    "INSERT INTO products (code, name, description, unit) VALUES ($1, $2, $3, $4) RETURNING *",
    [data.code, data.name, data.description || null, data.unit]
  );
  return result.rows[0] as Product;
}

export async function updateProduct(id: number, data: {
  code?: string;
  name?: string;
  description?: string;
  unit?: string;
}): Promise<Product | null> {
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
  if (data.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }
  if (data.unit !== undefined) {
    fields.push(`unit = $${paramIndex++}`);
    values.push(data.unit);
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(id);

  const result = await query(
    `UPDATE products SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] as Product || null;
}

export async function deleteProduct(id: number): Promise<boolean> {
  const result = await query("UPDATE products SET active = false WHERE id = $1", [id]);
  return result.rowCount !== undefined && result.rowCount > 0;
}
