import { Handlers } from "$fresh/server.ts";
import * as transferService from "../../services/transferService.ts";

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
        const transfer = await transferService.getTransferById(parseInt(id));
        if (!transfer) {
          return new Response(JSON.stringify({ error: "Transfer not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify(transfer), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const transfers = await transferService.getAllTransfers();
      return new Response(JSON.stringify(transfers), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching transfers:", error);
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
      data.created_by = ctx.state.session.userId;

      const transfer = await transferService.createTransfer(data);
      return new Response(JSON.stringify(transfer), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error creating transfer:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async PUT(req, ctx) {
    try {
      if (!ctx.state.session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      const data = await req.json();
      const { id, action } = data;

      if (action === "complete") {
        await transferService.completeTransfer(id);
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error updating transfer:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
