import { Handlers, PageProps } from "$fresh/server.ts";
import AdjustmentForm from "../islands/AdjustmentForm.tsx";

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

export default function Adjustments(props: PageProps<unknown, State>) {
  const { session } = props.state;
  
  return (
    <div>
      <h1 class="text-3xl font-bold mb-6">Inventory Adjustments</h1>
      <AdjustmentForm isAdmin={session?.role === "admin"} />
    </div>
  );
}
