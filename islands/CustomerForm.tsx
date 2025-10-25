import { useState, useEffect } from "preact/hooks";

interface Customer {
  id: number;
  code: string;
  name: string;
  email?: string;
  phone?: string;
}

export default function CustomerForm() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    email: "",
    phone: "",
    identification: "",
    address: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { ...formData, id: editingId } : formData;

      const response = await fetch("/api/customers", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        alert(editingId ? "Customer updated!" : "Customer created!");
        setFormData({ code: "", name: "", email: "", phone: "", identification: "", address: "" });
        setEditingId(null);
        loadCustomers();
      }
    } catch (error) {
      alert("Error saving customer");
    }
  };

  return (
    <div>
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-bold mb-4">{editingId ? "Edit" : "New"} Customer</h2>
        <form onSubmit={handleSubmit} class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Code</label>
            <input
              type="text"
              value={formData.code}
              onInput={(e) => setFormData({ ...formData, code: e.currentTarget.value })}
              required
              class="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onInput={(e) => setFormData({ ...formData, name: e.currentTarget.value })}
              required
              class="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onInput={(e) => setFormData({ ...formData, email: e.currentTarget.value })}
              class="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Phone</label>
            <input
              type="text"
              value={formData.phone}
              onInput={(e) => setFormData({ ...formData, phone: e.currentTarget.value })}
              class="w-full px-3 py-2 border rounded"
            />
          </div>
          <div class="col-span-2">
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              {editingId ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold mb-4">Customers List</h2>
        <table class="w-full">
          <thead>
            <tr class="border-b">
              <th class="text-left py-2">Code</th>
              <th class="text-left py-2">Name</th>
              <th class="text-left py-2">Email</th>
              <th class="text-left py-2">Phone</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} class="border-b">
                <td class="py-2">{c.code}</td>
                <td class="py-2">{c.name}</td>
                <td class="py-2">{c.email || "-"}</td>
                <td class="py-2">{c.phone || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
