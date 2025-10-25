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

export default function InvoiceDetail(props: PageProps<unknown, State>) {
  const id = props.params.id;

  return (
    <div>
      <h1 class="text-3xl font-bold mb-6">Invoice Details</h1>
      <div class="bg-white rounded-lg shadow-md p-6">
        <div id="invoiceDetails">Loading...</div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (async () => {
              try {
                const response = await fetch('/api/invoices?id=${id}');
                const invoice = await response.json();
                
                const details = document.getElementById('invoiceDetails');
                details.innerHTML = \`
                  <div class="mb-6">
                    <h2 class="text-xl font-bold mb-2">Invoice \${invoice.invoice_number}</h2>
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <p><strong>Customer:</strong> \${invoice.customer_name}</p>
                        <p><strong>Warehouse:</strong> \${invoice.warehouse_name}</p>
                        <p><strong>Date:</strong> \${new Date(invoice.invoice_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p><strong>Subtotal:</strong> $\${invoice.subtotal.toFixed(2)}</p>
                        <p><strong>Tax:</strong> $\${invoice.tax.toFixed(2)}</p>
                        <p class="text-lg"><strong>Total:</strong> $\${invoice.total.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <h3 class="text-lg font-bold mb-2">Items</h3>
                  <table class="w-full mb-6">
                    <thead>
                      <tr class="border-b">
                        <th class="text-left py-2">Product</th>
                        <th class="text-right py-2">Quantity</th>
                        <th class="text-right py-2">Unit Price</th>
                        <th class="text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      \${invoice.items.map(item => \`
                        <tr class="border-b">
                          <td class="py-2">\${item.product_name}</td>
                          <td class="py-2 text-right">\${item.quantity}</td>
                          <td class="py-2 text-right">$\${item.unit_price.toFixed(2)}</td>
                          <td class="py-2 text-right">$\${item.total.toFixed(2)}</td>
                        </tr>
                      \`).join('')}
                    </tbody>
                  </table>
                  
                  <div class="mt-4">
                    <a href="/invoices" class="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                      Back to Invoices
                    </a>
                  </div>
                \`;
              } catch (error) {
                document.getElementById('invoiceDetails').innerHTML = '<p class="text-red-500">Error loading invoice</p>';
              }
            })();
          `,
        }}
      />
    </div>
  );
}
