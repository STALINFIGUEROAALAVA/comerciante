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
    
    // Only admin can access
    if (ctx.state.session.role !== "admin") {
      return new Response(null, {
        status: 302,
        headers: { Location: "/" },
      });
    }
    
    return ctx.render();
  },
};

export default function Periods(_props: PageProps<unknown, State>) {
  return (
    <div>
      <h1 class="text-3xl font-bold mb-6">Inventory Periods (Admin Only)</h1>
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-bold mb-4">Create New Period</h2>
        <form id="periodForm" class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Period Name</label>
            <input
              type="text"
              name="period_name"
              required
              class="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Notes</label>
            <input
              type="text"
              name="notes"
              class="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="date"
              name="start_date"
              required
              class="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">End Date</label>
            <input
              type="date"
              name="end_date"
              required
              class="w-full px-3 py-2 border rounded"
            />
          </div>
          <div class="col-span-2">
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Period
            </button>
          </div>
        </form>
      </div>
      
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold mb-4">Periods List</h2>
        <div id="periodsList">Loading...</div>
      </div>
      
      <script
        dangerouslySetInnerHTML={{
          __html: `
            async function loadPeriods() {
              try {
                const response = await fetch('/api/periods');
                const periods = await response.json();
                
                const list = document.getElementById('periodsList');
                if (periods.length === 0) {
                  list.innerHTML = '<p class="text-gray-500">No periods found</p>';
                  return;
                }
                
                list.innerHTML = \`
                  <table class="w-full">
                    <thead>
                      <tr class="border-b">
                        <th class="text-left py-2">Period Name</th>
                        <th class="text-left py-2">Start Date</th>
                        <th class="text-left py-2">End Date</th>
                        <th class="text-center py-2">Status</th>
                        <th class="text-center py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      \${periods.map(period => \`
                        <tr class="border-b">
                          <td class="py-2">\${period.period_name}</td>
                          <td class="py-2">\${new Date(period.start_date).toLocaleDateString()}</td>
                          <td class="py-2">\${new Date(period.end_date).toLocaleDateString()}</td>
                          <td class="py-2 text-center">
                            <span class="px-2 py-1 rounded \${period.status === 'closed' ? 'bg-red-200' : 'bg-green-200'}">
                              \${period.status}
                            </span>
                          </td>
                          <td class="py-2 text-center">
                            \${period.status === 'open' ? \`
                              <button
                                onclick="closePeriod(\${period.id})"
                                class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                              >
                                Close
                              </button>
                            \` : '-'}
                          </td>
                        </tr>
                      \`).join('')}
                    </tbody>
                  </table>
                \`;
              } catch (error) {
                document.getElementById('periodsList').innerHTML = '<p class="text-red-500">Error loading periods</p>';
              }
            }
            
            async function closePeriod(id) {
              if (!confirm('Are you sure you want to close this period? This action cannot be undone.')) {
                return;
              }
              
              const notes = prompt('Enter closing notes (optional):');
              
              try {
                const response = await fetch('/api/periods', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id, notes })
                });
                
                if (response.ok) {
                  alert('Period closed successfully');
                  loadPeriods();
                } else {
                  const data = await response.json();
                  alert('Error: ' + (data.error || 'Failed to close period'));
                }
              } catch (error) {
                alert('Error closing period');
              }
            }
            
            document.getElementById('periodForm').addEventListener('submit', async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = Object.fromEntries(formData);
              
              try {
                const response = await fetch('/api/periods', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data)
                });
                
                if (response.ok) {
                  alert('Period created successfully');
                  e.target.reset();
                  loadPeriods();
                } else {
                  const data = await response.json();
                  alert('Error: ' + (data.error || 'Failed to create period'));
                }
              } catch (error) {
                alert('Error creating period');
              }
            });
            
            loadPeriods();
          `,
        }}
      />
    </div>
  );
}
