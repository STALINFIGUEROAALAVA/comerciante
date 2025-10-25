import { useState, useEffect } from "preact/hooks";

interface Warehouse {
  id: number;
  code: string;
  name: string;
  location?: string;
}

export default function WarehouseForm() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    location: "",
  });

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      const response = await fetch("/api/warehouses");
      const data = await response.json();
      setWarehouses(data);
    } catch (error) {
      console.error("Error loading warehouses:", error);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    try {
      const response = await fetch("/api/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert("Warehouse created!");
        setFormData({ code: "", name: "", location: "" });
        loadWarehouses();
      }
    } catch (error) {
      alert("Error saving warehouse");
    }
  };

  return (
    <div>
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-bold mb-4">New Warehouse</h2>
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
          <div class="col-span-2">
            <label class="block text-sm font-medium mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onInput={(e) => setFormData({ ...formData, location: e.currentTarget.value })}
              class="w-full px-3 py-2 border rounded"
            />
          </div>
          <div class="col-span-2">
            <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Create
            </button>
          </div>
        </form>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold mb-4">Warehouses List</h2>
        <table class="w-full">
          <thead>
            <tr class="border-b">
              <th class="text-left py-2">Code</th>
              <th class="text-left py-2">Name</th>
              <th class="text-left py-2">Location</th>
            </tr>
          </thead>
          <tbody>
            {warehouses.map((w) => (
              <tr key={w.id} class="border-b">
                <td class="py-2">{w.code}</td>
                <td class="py-2">{w.name}</td>
                <td class="py-2">{w.location || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
