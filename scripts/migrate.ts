import "dotenv";
import pool from "../db/client.ts";

async function migrate() {
  console.log("Running database migration...");
  
  try {
    const sql = await Deno.readTextFile("./db/schema.sql");
    const client = await pool.connect();
    
    try {
      await client.queryArray(sql);
      console.log("✅ Migration completed successfully!");
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
    Deno.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
