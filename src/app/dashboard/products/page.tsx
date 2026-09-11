import { Plus, Search, Filter, MoreHorizontal, Package } from "lucide-react";

export default function ProductsPage() {
  const products = [
    { id: "PRD-101", name: "Premium Wireless Headphones", stock: 124, price: 199.99, status: "Active" },
    { id: "PRD-102", name: "Mechanical Keyboard Pro", stock: 42, price: 149.99, status: "Active" },
    { id: "PRD-103", name: "Ergonomic Mouse v2", stock: 0, price: 79.99, status: "Out of Stock" },
    { id: "PRD-104", name: "USB-C Hub 8-in-1", stock: 215, price: 45.00, status: "Active" },
    { id: "PRD-105", name: "4K Monitor 27-inch", stock: 18, price: 349.99, status: "Low Stock" },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Products Catalog</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage your AI assistant's product knowledge.
          </p>
        </div>
        <button className="btn btn-primary sm:w-auto w-full">
          <Plus size={18} />
          <span>Add Product</span>
        </button>
      </div>

      <div className="card w-full flex flex-col">
        <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row gap-4 justify-between items-center bg-[var(--surface-active)]/30 rounded-t-lg">
          <div className="relative w-full sm:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full pl-9 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>
          <button className="btn btn-secondary w-full sm:w-auto">
            <Filter size={16} />
            <span>Filters</span>
          </button>
        </div>

        <div className="table-container border-x-0 border-b-0 rounded-none rounded-b-lg">
          <table>
            <thead>
              <tr>
                <th className="w-12 text-center">
                  <input type="checkbox" className="rounded border-[var(--border-light)] bg-transparent accent-[var(--accent)]" />
                </th>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const isOutOfStock = p.stock === 0;
                const isLowStock = p.stock > 0 && p.stock < 20;

                return (
                  <tr key={p.id} className="group">
                    <td className="text-center">
                      <input type="checkbox" className="rounded border-[var(--border-light)] bg-transparent accent-[var(--accent)]" />
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--surface-active)] rounded-md flex items-center justify-center text-[var(--text-muted)] shrink-0 border border-[var(--border)] group-hover:border-[var(--border-light)] transition-colors">
                          <Package size={20} />
                        </div>
                        <span className="font-semibold text-sm group-hover:text-[var(--accent)] transition-colors cursor-pointer">{p.name}</span>
                      </div>
                    </td>
                    <td className="font-mono text-sm text-[var(--text-muted)]">{p.id}</td>
                    <td className="font-medium font-mono">${p.price.toFixed(2)}</td>
                    <td className="font-medium text-sm">
                      <span className={`${isOutOfStock ? "text-[var(--danger)]" : isLowStock ? "text-[var(--warning)]" : "text-[var(--text-primary)]"}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td>
                      {isOutOfStock ? (
                        <span className="badge badge-danger">Out of Stock</span>
                      ) : isLowStock ? (
                        <span className="badge badge-warning">Low Stock</span>
                      ) : (
                        <span className="badge badge-success">Active</span>
                      )}
                    </td>
                    <td className="text-right">
                      <button className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-glow)] rounded-md transition-colors">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-[var(--border)] flex justify-between items-center text-sm text-[var(--text-secondary)]">
          <span>Showing 1 to 5 of 124 results</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 bg-[var(--surface-active)] border border-[var(--border)] rounded-md hover:text-[var(--text-primary)] disabled:opacity-50 mt-0">Previous</button>
            <button className="px-3 py-1 bg-[var(--surface-active)] border border-[var(--border)] rounded-md hover:text-[var(--text-primary)]">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
