import { Handlers } from "$fresh/server.ts";
import * as adjustmentService from "../../../../services/adjustmentService.ts";

export const handler: Handlers = {
  async POST(req, ctx) {
    try {
      if (!ctx.state.session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Only admin can approve
      if (ctx.state.session.role !== "admin") {
        return new Response(JSON.stringify({ error: "Forbidden" }), { 
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }

      const id = parseInt(ctx.params.id);
      const data = await req.json();
      
      await adjustmentService.approveAdjustment(
        id,
        ctx.state.session.userId,
        data.review_notes
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error approving adjustment:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
