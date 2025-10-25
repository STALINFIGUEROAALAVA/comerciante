import { useState, useEffect } from "preact/hooks";

interface AdjustmentFormProps {
  isAdmin?: boolean;
}

export default function AdjustmentForm({ isAdmin }: AdjustmentFormProps) {
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [formData, setFormData] = useState({
    warehouse_id: "",
    adjustment_type: "increase",
    effective_at: new Date().toISOString().split("T")[0],
    reason: "",
  });
  const [items, setItems] = useState<Array<{
    product_id: string;
    quantity: string;
    unit_cost: string;
  }>>([{ product_id: "", quantity: "", unit_cost: "" }]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [whResp, prodResp, adjResp] = await Promise.all([
        fetch("/api/warehouses"),
        fetch("/api/products"),
        fetch("/api/adjustments"),
      ]);
      setWarehouses(await whResp.json());
      setProducts(await prodResp.json());
      setAdjustments(await adjResp.json());
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const addItem = () => {
    setItems([...items, { product_id: "", quantity: "", unit_cost: "" }]);
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    try {
      const adjustmentData = {
        warehouse_id: parseInt(formData.warehouse_id),
        adjustment_type: formData.adjustment_type,
        effective_at: formData.effective_at,
        reason: formData.reason,
        items: items.map((item) => ({
          product_id: parseInt(item.product_id),
          quantity: parseFloat(item.quantity),
          unit_cost: item.unit_cost ? parseFloat(item.unit_cost) : undefined,
        })),
      };

      const response = await fetch("/api/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adjustmentData),
      });

      if (response.ok) {
        alert("Adjustment submitted!");
        setFormData({
          warehouse_id: "",
          adjustment_type: "increase",
          effective_at: new Date().toISOString().split("T")[0],
          reason: "",
        });
        setItems([{ product_id: "", quantity: "", unit_cost: "" }]);
        loadData();
      } else {
        const data = await response.json();
        alert("Error: " + (data.error || "Failed"));
      }
    } catch (error) {
      alert("Error submitting adjustment");
    }
  };

  const approveAdjustment = async (id: number) => {
    const notes = prompt("Review notes (optional):");
    
    try {
      const response = await fetch(`/api/adjustments/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_notes: notes }),
      });

      if (response.ok) {
        alert("Adjustment approved!");
        loadData();
      } else {
        const data = await response.json();
        alert("Error: " + (data.error || "Failed"));
      }
    } catch (error) {
      alert("Error");
    }
  };

  const rejectAdjustment = async (id: number) => {
    const notes = prompt("Rejection reason:");
    if (!notes) return;
    
    try {
      const response = await fetch(`/api/adjustments/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_notes: notes }),
      });

      if (response.ok) {
        alert("Adjustment rejected!");
        loadData();
      } else {
        const data = await response.json();
        alert("Error: " + (data.error || "Failed"));
      }
    } catch (error) {
      alert("Error");
    }
  };

  return (
    <div>
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-bold mb-4">New Adjustment</h2>
        <form onSubmit={handleSubmit}>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium mb-2">Warehouse</label>
              <select
                value={formData.warehouse_id}
                onChange={(e) => setFormData({ ...formData, warehouse_id: e.currentTarget.value })}
                required
                class="w-full px-3 py-2 border rounded"
              >
                <option value="">Select warehouse</option>
                {warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Type</label>
              <select
                value={formData.adjustment_type}
                onChange={(e) => setFormData({ ...formData, adjustment_type: e.currentTarget.value })}
                required
                class="w-full px-3 py-2 border rounded"
              >
                <option value="increase">Increase</option>
                <option value="decrease">Decrease</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Effective Date</label>
              <input
                type="date"
                value={formData.effective_at}
                onInput={(e) => setFormData({ ...formData, effective_at: e.currentTarget.value })}
                required
                class="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Reason</label>
              <input
                type="text"
                value={formData.reason}
                onInput={(e) => setFormData({ ...formData, reason: e.currentTarget.value })}
                class="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>

          <h3 class="text-lg font-bold mb-2">Items</h3>
          {items.map((item, index) => (
            <div key={index} class="grid grid-cols-4 gap-4 mb-2">
              <div>
                <select
                  value={item.product_id}
                  onChange={(e) => updateItem(index, "product_id", e.currentTarget.value)}
                  required
                  class="w-full px-3 py-2 border rounded"
                >
                  <option value="">Select product</option>
                  {products.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <input
                  type="number"
                  step="0.01"
                  value={item.quantity}
                  onInput={(e) => updateItem(index, "quantity", e.currentTarget.value)}
                  required
                  placeholder="Quantity"
                  class="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <input
                  type="number"
                  step="0.01"
                  value={item.unit_cost}
                  onInput={(e) => updateItem(index, "unit_cost", e.currentTarget.value)}
                  placeholder="Unit Cost"
                  class="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
          ))}
          
          <div class="flex gap-2 mt-4">
            <button
              type="button"
              onClick={addItem}
              class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add Item
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Submit Adjustment
            </button>
          </div>
        </form>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold mb-4">Adjustments List</h2>
        <table class="w-full">
          <thead>
            <tr class="border-b">
              <th class="text-left py-2">Number</th>
              <th class="text-left py-2">Warehouse</th>
              <th class="text-left py-2">Type</th>
              <th class="text-left py-2">Effective Date</th>
              <th class="text-center py-2">Status</th>
              {isAdmin && <th class="text-center py-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {adjustments.map((adj: any) => (
              <tr key={adj.id} class="border-b">
                <td class="py-2">{adj.adjustment_number}</td>
                <td class="py-2">{adj.warehouse_name}</td>
                <td class="py-2">{adj.adjustment_type}</td>
                <td class="py-2">{new Date(adj.effective_at).toLocaleDateString()}</td>
                <td class="py-2 text-center">
                  <span class={`px-2 py-1 rounded ${
                    adj.status === 'APPROVED' ? 'bg-green-200' :
                    adj.status === 'REJECTED' ? 'bg-red-200' :
                    'bg-yellow-200'
                  }`}>
                    {adj.status}
                  </span>
                </td>
                {isAdmin && (
                  <td class="py-2 text-center">
                    {adj.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => approveAdjustment(adj.id)}
                          class="text-green-600 hover:underline mr-2"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectAdjustment(adj.id)}
                          class="text-red-600 hover:underline"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
