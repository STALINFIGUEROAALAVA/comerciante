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

export default function Valuation(_props: PageProps<unknown, State>) {
  return (
    <div>
      <h1 class="text-3xl font-bold mb-6">Inventory Valuation Report</h1>
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="mb-4 flex gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Cutoff Date</label>
            <input
              type="date"
              id="cutoffDate"
              class="px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Warehouse (Optional)</label>
            <input
              type="number"
              id="warehouseId"
              class="px-3 py-2 border rounded"
              placeholder="All warehouses"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">&nbsp;</label>
            <button
              onclick="loadValuation()"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Generate Report
            </button>
          </div>
        </div>
        <div id="valuationData">
          <p class="text-gray-500">Click Generate Report to view valuation</p>
        </div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            async function loadValuation() {
              const cutoffDate = document.getElementById('cutoffDate').value;
              const warehouseId = document.getElementById('warehouseId').value;
              
              let url = '/api/valuation';
              const params = new URLSearchParams();
              if (cutoffDate) params.append('cutoff_date', cutoffDate);
              if (warehouseId) params.append('warehouse_id', warehouseId);
              if (params.toString()) url += '?' + params.toString();
              
              try {
                const response = await fetch(url);
                const data = await response.json();
                
                const container = document.getElementById('valuationData');
                if (data.length === 0) {
                  container.innerHTML = '<p class="text-gray-500">No data found</p>';
                  return;
                }
                
                const totalValue = data.reduce((sum, item) => sum + item.total_value, 0);
                
                container.innerHTML = \`
                  <table class="w-full">
                    <thead>
                      <tr class="border-b">
                        <th class="text-left py-2">Product</th>
                        <th class="text-left py-2">Warehouse</th>
                        <th class="text-right py-2">Quantity</th>
                        <th class="text-right py-2">Avg Cost</th>
                        <th class="text-right py-2">Total Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      \${data.map(item => \`
                        <tr class="border-b">
                          <td class="py-2">\${item.product_name} (\${item.product_code})</td>
                          <td class="py-2">\${item.warehouse_name}</td>
                          <td class="py-2 text-right">\${item.quantity}</td>
                          <td class="py-2 text-right">$\${item.avg_cost.toFixed(2)}</td>
                          <td class="py-2 text-right">$\${item.total_value.toFixed(2)}</td>
                        </tr>
                      \`).join('')}
                      <tr class="font-bold border-t-2">
                        <td colspan="4" class="py-2 text-right">Total:</td>
                        <td class="py-2 text-right">$\${totalValue.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                \`;
              } catch (error) {
                document.getElementById('valuationData').innerHTML = '<p class="text-red-500">Error loading valuation</p>';
              }
            }
          `,
        }}
      />
    </div>
  );
}
