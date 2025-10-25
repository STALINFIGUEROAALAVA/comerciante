import { useState, useEffect } from "preact/hooks";

interface Product {
  id: number;
  code: string;
  name: string;
  description?: string;
  unit: string;
}

export default function ProductForm() {
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    unit: "",
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    try {
      const url = "/api/products";
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { ...formData, id: editingId } : formData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        alert(editingId ? "Product updated!" : "Product created!");
        setFormData({ code: "", name: "", description: "", unit: "" });
        setEditingId(null);
        loadProducts();
      } else {
        alert("Error saving product");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error saving product");
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      code: product.code,
      name: product.name,
      description: product.description || "",
      unit: product.unit,
    });
    setEditingId(product.id);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;

    try {
      const response = await fetch(`/api/products?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Product deleted!");
        loadProducts();
      } else {
        alert("Error deleting product");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error deleting product");
    }
  };

  return (
    <div>
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-bold mb-4">
          {editingId ? "Edit Product" : "New Product"}
        </h2>
        <form onSubmit={handleSubmit} class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Code</label>
            <input
              type="text"
              value={formData.code}
              onInput={(e) =>
                setFormData({ ...formData, code: e.currentTarget.value })}
              required
              class="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onInput={(e) =>
                setFormData({ ...formData, name: e.currentTarget.value })}
              required
              class="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Unit</label>
            <input
              type="text"
              value={formData.unit}
              onInput={(e) =>
                setFormData({ ...formData, unit: e.currentTarget.value })}
              required
              class="w-full px-3 py-2 border rounded"
              placeholder="e.g., pcs, kg, liter"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Description</label>
            <input
              type="text"
              value={formData.description}
              onInput={(e) =>
                setFormData({ ...formData, description: e.currentTarget.value })}
              class="w-full px-3 py-2 border rounded"
            />
          </div>
          <div class="col-span-2 flex gap-2">
            <button
              type="submit"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {editingId ? "Update" : "Create"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({ code: "", name: "", description: "", unit: "" });
                }}
                class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-bold mb-4">Products List</h2>
        {products.length === 0 ? (
          <p class="text-gray-500">No products found</p>
        ) : (
          <table class="w-full">
            <thead>
              <tr class="border-b">
                <th class="text-left py-2">Code</th>
                <th class="text-left py-2">Name</th>
                <th class="text-left py-2">Unit</th>
                <th class="text-left py-2">Description</th>
                <th class="text-center py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} class="border-b">
                  <td class="py-2">{product.code}</td>
                  <td class="py-2">{product.name}</td>
                  <td class="py-2">{product.unit}</td>
                  <td class="py-2">{product.description || "-"}</td>
                  <td class="py-2 text-center">
                    <button
                      onClick={() => handleEdit(product)}
                      class="text-blue-600 hover:underline mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      class="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
