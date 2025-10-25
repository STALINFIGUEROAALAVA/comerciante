import { Handlers } from "$fresh/server.ts";
import { query } from "../../db/client.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      if (!ctx.state.session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      const url = new URL(req.url);
      const productId = url.searchParams.get("product_id");
      const warehouseId = url.searchParams.get("warehouse_id");

      if (!productId || !warehouseId) {
        return new Response(JSON.stringify({ error: "Product ID and Warehouse ID required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await query(
        `SELECT * FROM stock_ledger 
         WHERE product_id = $1 AND warehouse_id = $2 
         ORDER BY transaction_date, created_at`,
        [parseInt(productId), parseInt(warehouseId)]
      );

      return new Response(JSON.stringify(result.rows), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching kardex:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
