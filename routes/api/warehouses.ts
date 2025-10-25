import { Handlers } from "$fresh/server.ts";
import * as warehouseService from "../../services/warehouseService.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    try {
      if (!ctx.state.session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      const warehouses = await warehouseService.getAllWarehouses();
      return new Response(JSON.stringify(warehouses), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async POST(req, ctx) {
    try {
      if (!ctx.state.session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      const data = await req.json();
      const warehouse = await warehouseService.createWarehouse(data);
      return new Response(JSON.stringify(warehouse), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error creating warehouse:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
