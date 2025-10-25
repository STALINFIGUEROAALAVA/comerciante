import { useState, useEffect } from "preact/hooks";

export default function InvoiceBuilder() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [formData, setFormData] = useState({
    customer_id: "",
    warehouse_id: "",
    invoice_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [items, setItems] = useState<Array<{
    product_id: string;
    quantity: string;
    unit_price: string;
  }>>([{ product_id: "", quantity: "", unit_price: "" }]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [custResp, prodResp, whResp] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/products"),
        fetch("/api/warehouses"),
      ]);
      setCustomers(await custResp.json());
      setProducts(await prodResp.json());
      setWarehouses(await whResp.json());
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const addItem = () => {
    setItems([...items, { product_id: "", quantity: "", unit_price: "" }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    try {
      const invoiceData = {
        ...formData,
        customer_id: parseInt(formData.customer_id),
        warehouse_id: parseInt(formData.warehouse_id),
        items: items.map((item) => ({
          product_id: parseInt(item.product_id),
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
        })),
      };

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      });

      if (response.ok) {
        alert("Invoice created!");
        window.location.href = "/invoices";
      } else {
        const data = await response.json();
        alert("Error: " + (data.error || "Failed to create invoice"));
      }
    } catch (error) {
      alert("Error creating invoice");
    }
  };

  return (
    <div class="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit}>
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block text-sm font-medium mb-2">Customer</label>
            <select
              value={formData.customer_id}
              onChange={(e) => setFormData({ ...formData, customer_id: e.currentTarget.value })}
              required
              class="w-full px-3 py-2 border rounded"
            >
              <option value="">Select customer</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
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
            <label class="block text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              value={formData.invoice_date}
              onInput={(e) => setFormData({ ...formData, invoice_date: e.currentTarget.value })}
              required
              class="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Notes</label>
            <input
              type="text"
              value={formData.notes}
              onInput={(e) => setFormData({ ...formData, notes: e.currentTarget.value })}
              class="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>

        <h3 class="text-lg font-bold mb-4">Items</h3>
        {items.map((item, index) => (
          <div key={index} class="grid grid-cols-4 gap-4 mb-4">
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
                value={item.unit_price}
                onInput={(e) => updateItem(index, "unit_price", e.currentTarget.value)}
                required
                placeholder="Unit Price"
                class="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Remove
              </button>
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
            Create Invoice
          </button>
        </div>
      </form>
    </div>
  );
}
