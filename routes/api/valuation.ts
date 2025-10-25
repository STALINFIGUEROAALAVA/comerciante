import { Handlers } from "$fresh/server.ts";
import { getValuationReport } from "../../services/cost.ts";

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
      const cutoffDateStr = url.searchParams.get("cutoff_date");
      const warehouseIdStr = url.searchParams.get("warehouse_id");

      const cutoffDate = cutoffDateStr ? new Date(cutoffDateStr) : undefined;
      const warehouseId = warehouseIdStr ? parseInt(warehouseIdStr) : undefined;

      const report = await getValuationReport(cutoffDate, warehouseId);

      return new Response(JSON.stringify(report), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error generating valuation report:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
