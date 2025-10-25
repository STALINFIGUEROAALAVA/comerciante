import { Handlers, PageProps } from "$fresh/server.ts";
import InvoiceBuilder from "../../islands/InvoiceBuilder.tsx";

interface State {
  session?: {
    username: string;
    role: string;
  };
}

export const handler: Handlers<unknown, State> = {
  GET(_req, ctx) {
    if (!ctx.state.session) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/login" },
      });
    }
    return ctx.render();
  },
};

export default function NewInvoice(_props: PageProps<unknown, State>) {
  return (
    <div>
      <h1 class="text-3xl font-bold mb-6">New Invoice</h1>
      <InvoiceBuilder />
    </div>
  );
}
