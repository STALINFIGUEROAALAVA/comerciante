import { Handlers, PageProps } from "$fresh/server.ts";

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

export default function Home(props: PageProps<unknown, State>) {
  const { session } = props.state;

  return (
    <div>
      <h1 class="text-3xl font-bold mb-6">Welcome to Billing System</h1>
      <div class="bg-white rounded-lg shadow-md p-6">
        <p class="text-lg mb-4">
          Logged in as: <strong>{session?.username}</strong> ({session?.role})
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="/products"
            class="block p-4 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
          >
            <h3 class="font-bold text-lg">Products</h3>
            <p class="text-sm">Manage product catalog</p>
          </a>
          <a
            href="/customers"
            class="block p-4 bg-green-100 rounded hover:bg-green-200 transition-colors"
          >
            <h3 class="font-bold text-lg">Customers</h3>
            <p class="text-sm">Manage customer information</p>
          </a>
          <a
            href="/invoices"
            class="block p-4 bg-purple-100 rounded hover:bg-purple-200 transition-colors"
          >
            <h3 class="font-bold text-lg">Invoices</h3>
            <p class="text-sm">Create and view invoices</p>
          </a>
          <a
            href="/warehouses"
            class="block p-4 bg-yellow-100 rounded hover:bg-yellow-200 transition-colors"
          >
            <h3 class="font-bold text-lg">Warehouses</h3>
            <p class="text-sm">Manage warehouse inventory</p>
          </a>
          <a
            href="/transfers"
            class="block p-4 bg-red-100 rounded hover:bg-red-200 transition-colors"
          >
            <h3 class="font-bold text-lg">Transfers</h3>
            <p class="text-sm">Transfer stock between warehouses</p>
          </a>
          <a
            href="/adjustments"
            class="block p-4 bg-indigo-100 rounded hover:bg-indigo-200 transition-colors"
          >
            <h3 class="font-bold text-lg">Adjustments</h3>
            <p class="text-sm">Inventory adjustments</p>
          </a>
          <a
            href="/kardex"
            class="block p-4 bg-pink-100 rounded hover:bg-pink-200 transition-colors"
          >
            <h3 class="font-bold text-lg">Kardex</h3>
            <p class="text-sm">View stock movements</p>
          </a>
          <a
            href="/valuation"
            class="block p-4 bg-teal-100 rounded hover:bg-teal-200 transition-colors"
          >
            <h3 class="font-bold text-lg">Valuation</h3>
            <p class="text-sm">Inventory valuation report</p>
          </a>
          {session?.role === "admin" && (
            <a
              href="/periods"
              class="block p-4 bg-orange-100 rounded hover:bg-orange-200 transition-colors"
            >
              <h3 class="font-bold text-lg">Periods</h3>
              <p class="text-sm">Manage inventory periods</p>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
