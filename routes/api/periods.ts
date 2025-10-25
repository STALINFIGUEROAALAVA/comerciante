import { Handlers } from "$fresh/server.ts";
import * as periodService from "../../services/periodService.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    try {
      if (!ctx.state.session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      const periods = await periodService.getAllPeriods();
      return new Response(JSON.stringify(periods), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching periods:", error);
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

      // Only admin can create periods
      if (ctx.state.session.role !== "admin") {
        return new Response(JSON.stringify({ error: "Forbidden" }), { 
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }

      const data = await req.json();
      const period = await periodService.createPeriod(data);
      return new Response(JSON.stringify(period), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error creating period:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
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

      // Only admin can close periods
      if (ctx.state.session.role !== "admin") {
        return new Response(JSON.stringify({ error: "Forbidden" }), { 
          status: 403,
          headers: { "Content-Type": "application/json" }
        });
      }

      const data = await req.json();
      const { id, notes } = data;

      const period = await periodService.closePeriod(id, ctx.state.session.userId, notes);
      
      if (!period) {
        return new Response(JSON.stringify({ error: "Period not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(period), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error closing period:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
