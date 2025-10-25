import { Handlers } from "$fresh/server.ts";
import * as adjustmentService from "../../services/adjustmentService.ts";

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
      const id = url.searchParams.get("id");

      if (id) {
        const adjustment = await adjustmentService.getAdjustmentById(parseInt(id));
        if (!adjustment) {
          return new Response(JSON.stringify({ error: "Adjustment not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify(adjustment), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const adjustments = await adjustmentService.getAllAdjustments();
      return new Response(JSON.stringify(adjustments), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching adjustments:", error);
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
      data.submitted_by = ctx.state.session.userId;

      const adjustment = await adjustmentService.createAdjustment(data);
      return new Response(JSON.stringify(adjustment), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error creating adjustment:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
