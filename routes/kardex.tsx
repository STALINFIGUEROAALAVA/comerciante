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

export default function Kardex(_props: PageProps<unknown, State>) {
  return (
    <div>
      <h1 class="text-3xl font-bold mb-6">Kardex (Stock Ledger)</h1>
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="mb-4 grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Product ID</label>
            <input
              type="number"
              id="productId"
              class="w-full px-3 py-2 border rounded"
              placeholder="Enter product ID"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Warehouse ID</label>
            <input
              type="number"
              id="warehouseId"
              class="w-full px-3 py-2 border rounded"
              placeholder="Enter warehouse ID"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">&nbsp;</label>
            <button
              onclick="loadKardex()"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Load Kardex
            </button>
          </div>
        </div>
        <div id="kardexData">
          <p class="text-gray-500">Select product and warehouse to view kardex</p>
        </div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            async function loadKardex() {
              const productId = document.getElementById('productId').value;
              const warehouseId = document.getElementById('warehouseId').value;
              
              if (!productId || !warehouseId) {
                alert('Please enter both product and warehouse ID');
                return;
              }
              
              try {
                const response = await fetch(\`/api/kardex?product_id=\${productId}&warehouse_id=\${warehouseId}\`);
                const data = await response.json();
                
                const container = document.getElementById('kardexData');
                if (data.length === 0) {
                  container.innerHTML = '<p class="text-gray-500">No movements found</p>';
                  return;
                }
                
                container.innerHTML = \`
                  <table class="w-full">
                    <thead>
                      <tr class="border-b">
                        <th class="text-left py-2">Date</th>
                        <th class="text-left py-2">Type</th>
                        <th class="text-right py-2">Quantity</th>
                        <th class="text-right py-2">Unit Cost</th>
                        <th class="text-right py-2">Value Change</th>
                        <th class="text-right py-2">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      \${data.map(entry => \`
                        <tr class="border-b">
                          <td class="py-2">\${new Date(entry.transaction_date).toLocaleDateString()}</td>
                          <td class="py-2">\${entry.transaction_type}</td>
                          <td class="py-2 text-right">\${entry.quantity}</td>
                          <td class="py-2 text-right">$\${(entry.unit_cost || 0).toFixed(2)}</td>
                          <td class="py-2 text-right">$\${(entry.value_change || 0).toFixed(2)}</td>
                          <td class="py-2 text-right">\${entry.balance_quantity}</td>
                        </tr>
                      \`).join('')}
                    </tbody>
                  </table>
                \`;
              } catch (error) {
                document.getElementById('kardexData').innerHTML = '<p class="text-red-500">Error loading kardex</p>';
              }
            }
          `,
        }}
      />
    </div>
  );
}
