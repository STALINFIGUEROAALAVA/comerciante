import { Handlers } from "$fresh/server.ts";
import * as invoiceService from "../../services/invoiceService.ts";

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
        const invoice = await invoiceService.getInvoiceById(parseInt(id));
        if (!invoice) {
          return new Response(JSON.stringify({ error: "Invoice not found" }), {
            status: 404,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify(invoice), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const invoices = await invoiceService.getAllInvoices();
      return new Response(JSON.stringify(invoices), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching invoices:", error);
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
      
      const invoice = await invoiceService.createInvoice(data);
      return new Response(JSON.stringify(invoice), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error creating invoice:", error);
      const message = error instanceof Error ? error.message : "Internal server error";
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
