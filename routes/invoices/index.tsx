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

export default function InvoicesIndex(_props: PageProps<unknown, State>) {
  return (
    <div>
      <h1 class="text-3xl font-bold mb-6">Invoices</h1>
      <div class="mb-4">
        <a
          href="/invoices/new"
          class="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          New Invoice
        </a>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6">
        <div id="invoicesList">Loading...</div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (async () => {
              try {
                const response = await fetch('/api/invoices');
                const invoices = await response.json();
                
                const list = document.getElementById('invoicesList');
                if (invoices.length === 0) {
                  list.innerHTML = '<p class="text-gray-500">No invoices found</p>';
                  return;
                }
                
                list.innerHTML = \`
                  <table class="w-full">
                    <thead>
                      <tr class="border-b">
                        <th class="text-left py-2">Invoice #</th>
                        <th class="text-left py-2">Customer</th>
                        <th class="text-left py-2">Date</th>
                        <th class="text-right py-2">Total</th>
                        <th class="text-center py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      \${invoices.map(inv => \`
                        <tr class="border-b">
                          <td class="py-2">\${inv.invoice_number}</td>
                          <td class="py-2">\${inv.customer_name}</td>
                          <td class="py-2">\${new Date(inv.invoice_date).toLocaleDateString()}</td>
                          <td class="py-2 text-right">$\${inv.total.toFixed(2)}</td>
                          <td class="py-2 text-center">
                            <a href="/invoices/\${inv.id}" class="text-blue-600 hover:underline">View</a>
                          </td>
                        </tr>
                      \`).join('')}
                    </tbody>
                  </table>
                \`;
              } catch (error) {
                document.getElementById('invoicesList').innerHTML = '<p class="text-red-500">Error loading invoices</p>';
              }
            })();
          `,
        }}
      />
    </div>
  );
}
