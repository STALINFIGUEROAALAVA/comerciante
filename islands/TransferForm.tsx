import { useState, useEffect } from "preact/hooks";

export default function TransferForm() {
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [formData, setFormData] = useState({
    from_warehouse_id: "",
    to_warehouse_id: "",
    transfer_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [items, setItems] = useState<Array<{
    product_id: string;
    quantity: string;
  }>>([{ product_id: "", quantity: "" }]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [whResp, prodResp, transResp] = await Promise.all([
        fetch("/api/warehouses"),
        fetch("/api/products"),
        fetch("/api/transfers"),
      ]);
      setWarehouses(await whResp.json());
      setProducts(await prodResp.json());
      setTransfers(await transResp.json());
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const addItem = () => {
    setItems([...items, { product_id: "", quantity: "" }]);
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    try {
      const transferData = {
        from_warehouse_id: parseInt(formData.from_warehouse_id),
        to_warehouse_id: parseInt(formData.to_warehouse_id),
        transfer_date: formData.transfer_date,
        notes: formData.notes,
        items: items.map((item) => ({
          product_id: parseInt(item.product_id),
          quantity: parseFloat(item.quantity),
        })),
      };

      const response = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transferData),
      });

      if (response.ok) {
        alert("Transfer created!");
        setFormData({
          from_warehouse_id: "",
          to_warehouse_id: "",
          transfer_date: new Date().toISOString().split("T")[0],
          notes: "",
        });
        setItems([{ product_id: "", quantity: "" }]);
        loadData();
      } else {
        const data = await response.json();
        alert("Error: " + (data.error || "Failed to create transfer"));
      }
    } catch (error) {
      alert("Error creating transfer");
    }
  };

  const completeTransfer = async (id: number) => {
    if (!confirm("Complete this transfer?")) return;
    
    try {
      const response = await fetch("/api/transfers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "complete" }),
      });

      if (response.ok) {
        alert("Transfer completed!");
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
        <h2 class="text-xl font-bold mb-4">New Transfer</h2>
        <form onSubmit={handleSubmit}>
          <div class="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label class="block text-sm font-medium mb-2">From Warehouse</label>
              <select
                value={formData.from_warehouse_id}
                onChange={(e) => setFormData({ ...formData, from_warehouse_id: e.currentTarget.value })}
                required
                class="w-full px-3 py-2 border rounded"
              >
                <option value="">Select</option>
                {warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">To Warehouse</label>
              <select
                value={formData.to_warehouse_id}
                onChange={(e) => setFormData({ ...formData, to_warehouse_id: e.currentTarget.value })}
                required
                class="w-full px-3 py-2 border rounded"
              >
                <option value="">Select</option>
                {warehouses.map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Date</label>
              <input
                type="date"
                value={formData.transfer_date}
                onInput={(e) => setFormData({ ...formData, transfer_date: e.currentTarget.value })}
                required
                class="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>

          <h3 class="text-lg font-bold mb-2">Items</h3>
          {items.map((item, index) => (
            <div key={index} class="grid grid-cols-3 gap-4 mb-2">
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
              Create Transfer
            </button>
          </div>
        </form>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold mb-4">Transfers List</h2>
        <table class="w-full">
          <thead>
            <tr class="border-b">
              <th class="text-left py-2">Number</th>
              <th class="text-left py-2">From</th>
              <th class="text-left py-2">To</th>
              <th class="text-left py-2">Date</th>
              <th class="text-center py-2">Status</th>
              <th class="text-center py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((t: any) => (
              <tr key={t.id} class="border-b">
                <td class="py-2">{t.transfer_number}</td>
                <td class="py-2">{t.from_warehouse_name}</td>
                <td class="py-2">{t.to_warehouse_name}</td>
                <td class="py-2">{new Date(t.transfer_date).toLocaleDateString()}</td>
                <td class="py-2 text-center">{t.status}</td>
                <td class="py-2 text-center">
                  {t.status === "pending" && (
                    <button
                      onClick={() => completeTransfer(t.id)}
                      class="text-blue-600 hover:underline"
                    >
                      Complete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
