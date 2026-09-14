"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, Package, Download, Pencil, Trash2, X } from "lucide-react";

type ProductRecord = {
  id: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  price?: number | string | null;
  stock?: number | null;
  category?: string | null;
  is_enabled?: boolean;
  currency: string;
  barcode?: string | null;
  image_url?: string | null;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [enabled, setEnabled] = useState<"all" | "enabled" | "disabled">("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({ name: "", price: "100", stock: "10", category: "General", sku: "", description: "", currency: "BDT" });

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (category) params.set("category", category);
      if (enabled === "enabled") params.set("enabled", "true");
      if (enabled === "disabled") params.set("enabled", "false");

      const response = await fetch(`/api/products?${params.toString()}`, { credentials: "same-origin" });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({ error: "Unable to load products." }));
        setError(payload?.error ?? "Unable to load products.");
        return;
      }
      const payload = await response.json();
      setProducts(Array.isArray(payload?.data) ? payload.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, [query, category, enabled]);

  const saveProduct = async () => {
    try {
      const formData = new FormData();
      if (editingId) formData.append("id", editingId);
      formData.append("name", form.name);
      formData.append("price", String(Number(form.price)));
      formData.append("stock", String(Number(form.stock)));
      formData.append("category", form.category);
      if (form.sku) formData.append("sku", form.sku);
      if (form.description) formData.append("description", form.description);
      formData.append("currency", form.currency || "BDT");
      formData.append("is_enabled", String(enabled !== "disabled"));
      if (imageFile) formData.append("image", imageFile);

      const method = editingId ? "PUT" : "POST";
      const response = await fetch("/api/products", {
        method,
        credentials: "same-origin",
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload?.error ?? "Unable to save product.");
        return;
      }
      setForm({ name: "", price: "100", stock: "10", category: "General", sku: "", description: "", currency: "BDT" });
      setImageFile(null);
      setEditingId(null);
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save product.");
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const response = await fetch("/api/products", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload?.error ?? "Unable to delete product.");
        return;
      }
      await loadProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete product.");
    }
  };

  const exportCsv = async () => {
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (category) params.set("category", category);
      if (enabled === "enabled") params.set("enabled", "true");
      if (enabled === "disabled") params.set("enabled", "false");
      const response = await fetch(`/api/products?${params.toString()}`, { credentials: "same-origin" });
      const payload = await response.json();
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      const csvRows = [
        ["id", "name", "description", "price", "currency", "stock", "sku", "category", "is_enabled"],
        ...rows.map((p: ProductRecord) => [p.id, p.name, p.description ?? "", p.price ?? "", p.currency ?? "", p.stock ?? "", p.sku ?? "", p.category ?? "", p.is_enabled ? "true" : "false"]),
      ];
      const csv = csvRows.map((r: Array<string | number | boolean | null | undefined>) => r.map((v: string | number | boolean | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "products.csv";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to export products.");
    }
  };

  const productCount = products.length;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Products Catalog</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage your AI assistant's product knowledge.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={exportCsv}><Download size={18}/> <span>Export CSV</span></button>
          <button className="btn btn-primary sm:w-auto w-full" onClick={() => setEditingId(null)}>
            <Plus size={18} /> <span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} type="text" placeholder="Search products..." className="w-full pl-9 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-sm" />
          </div>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="input">
            <option value="">All Categories</option>
            <option value="General">General</option>
          </select>
          <select value={enabled} onChange={(event) => setEnabled(event.target.value as "all" | "enabled" | "disabled")} className="input">
            <option value="all">All Status</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
          </select>
          <button className="btn btn-secondary" onClick={loadProducts}><Filter size={16}/><span>Filters</span></button>
        </div>
        {error && <div className="mt-3 text-sm text-[var(--danger)]">{error}</div>}
      </div>

      <div className="card w-full flex flex-col">
        <div className="table-container border-x-0 border-b-0 rounded-none rounded-b-lg">
          <table>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6}><span className="text-sm text-[var(--text-muted)]">Loading products...</span></td></tr>}
              {!loading && products.map((p) => {
                const isOutOfStock = Number(p.stock ?? 0) === 0;
                const isLowStock = Number(p.stock ?? 0) > 0 && Number(p.stock ?? 0) < 20;
                return (
                  <tr key={p.id} className="group">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--surface-active)] rounded-md flex items-center justify-center text-[var(--text-muted)] shrink-0 border border-[var(--border)] group-hover:border-[var(--border-light)] transition-colors">
                          <Package size={20} />
                        </div>
                        <span className="font-semibold text-sm group-hover:text-[var(--accent)] transition-colors cursor-pointer">{p.name}</span>
                      </div>
                    </td>
                    <td className="font-mono text-sm text-[var(--text-muted)]">{p.sku ?? p.id}</td>
                    <td className="font-medium font-mono">${Number(p.price ?? 0).toFixed(2)}</td>
                    <td className="font-medium text-sm"><span className={`${isOutOfStock ? "text-[var(--danger)]" : isLowStock ? "text-[var(--warning)]" : "text-[var(--text-primary)]"}`}>{p.stock ?? 0}</span></td>
                    <td>{isOutOfStock ? <span className="badge badge-danger">Out of Stock</span> : isLowStock ? <span className="badge badge-warning">Low Stock</span> : <span className="badge badge-success">Active</span>}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-glow)] rounded-md transition-colors" onClick={() => { setEditingId(p.id); setForm({ name: p.name, price: String(p.price ?? 0), stock: String(p.stock ?? 0), category: p.category ?? "General", sku: p.sku ?? "", description: p.description ?? "", currency: p.currency ?? "BDT" }); }}><Pencil size={16}/></button>
                        <button className="p-2 text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] rounded-md transition-colors" onClick={() => deleteProduct(p.id)}><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-[var(--border)] flex justify-between items-center text-sm text-[var(--text-secondary)]">
          <span>{productCount} product{productCount === 1 ? "" : "s"}</span>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">{editingId ? "Edit Product" : "Add Product"}</h2>
          <button className="p-2" onClick={() => { setForm({ name: "", price: "100", stock: "10", category: "General", sku: "", description: "", currency: "BDT" }); setEditingId(null); }}><X size={16}/></button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Product Name" />
          <input className="input" value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} placeholder="SKU" />
          <input className="input" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="Price" />
          <input className="input" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} placeholder="Stock" />
          <input className="input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Category" />
          <select className="input" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}>
            <option value="BDT">BDT</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
          <div className="md:col-span-2">
            <label className="text-sm text-[var(--text-secondary)]">Product image</label>
            <input className="input mt-2" type="file" accept="image/*" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} />
          </div>
          <textarea className="input md:col-span-2" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description" />
        </div>
        <div className="flex gap-2 mt-4">
          <button className="btn btn-primary" onClick={saveProduct}>{editingId ? "Update Product" : "Create Product"}</button>
        </div>
      </div>
    </div>
  );
}
