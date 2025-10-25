import { Handlers, PageProps } from "$fresh/server.ts";
import WarehouseForm from "../islands/WarehouseForm.tsx";

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

export default function Warehouses(_props: PageProps<unknown, State>) {
  return (
    <div>
      <h1 class="text-3xl font-bold mb-6">Warehouses Management</h1>
      <WarehouseForm />
    </div>
  );
}
