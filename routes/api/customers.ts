import { Handlers } from "$fresh/server.ts";
import * as invoiceService from "../../services/invoiceService.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    try {
      if (!ctx.state.session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      const customers = await invoiceService.getAllCustomers();
      return new Response(JSON.stringify(customers), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching customers:", error);
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
      const customer = await invoiceService.createCustomer(data);
      return new Response(JSON.stringify(customer), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error creating customer:", error);
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

      const data = await req.json();
      const { id, ...updateData } = data;
      const customer = await invoiceService.updateCustomer(id, updateData);
      
      if (!customer) {
        return new Response(JSON.stringify({ error: "Customer not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(customer), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error updating customer:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async DELETE(req, ctx) {
    try {
      if (!ctx.state.session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }

      const url = new URL(req.url);
      const id = parseInt(url.searchParams.get("id") || "");
      
      if (!id) {
        return new Response(JSON.stringify({ error: "Invalid ID" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      await invoiceService.deleteCustomer(id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error deleting customer:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
