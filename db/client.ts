import { Pool } from "postgres";
import "dotenv";

const pool = new Pool({
  hostname: Deno.env.get("DATABASE_HOST") || "localhost",
  port: parseInt(Deno.env.get("DATABASE_PORT") || "5432"),
  database: Deno.env.get("DATABASE_NAME") || "billing_db",
  user: Deno.env.get("DATABASE_USER") || "postgres",
  password: Deno.env.get("DATABASE_PASSWORD") || "postgres",
}, 10);

export default pool;

export async function query(text: string, params?: unknown[]) {
  const client = await pool.connect();
  try {
    return await client.queryObject(text, params);
  } finally {
    client.release();
  }
}
