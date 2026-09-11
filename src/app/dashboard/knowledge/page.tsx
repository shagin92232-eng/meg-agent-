import { UploadCloud, FileText, File, ExternalLink, RefreshCw, Trash2 } from "lucide-react";

export default function KnowledgeBasePage() {
  const documents = [
    { id: 1, title: "Return Policy 2024", type: "PDF", size: "1.2 MB", date: "Jan 12, 2024", status: "Active", chunks: 42 },
    { id: 2, title: "Product Assembly Guides", type: "DOCX", size: "4.5 MB", date: "Feb 05, 2024", status: "Processing", chunks: 0 },
    { id: 3, title: "Shipping FAQs", type: "TXT", size: "45 KB", date: "Mar 10, 2024", status: "Active", chunks: 8 },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">AI Knowledge Base</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Upload documents (PDF, DOCX, TXT) to teach your AI about your business.
          </p>
        </div>
        <button className="btn btn-primary shadow-lg shadow-[var(--accent-glow)]">
          <UploadCloud size={18} />
          <span>Upload Documents</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Zone */}
        <div className="card p-8 flex flex-col items-center justify-center text-center border-dashed border-2 border-[var(--border-light)] hover:border-[var(--accent)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer min-h-[300px] group">
          <div className="w-16 h-16 bg-[var(--surface-active)] text-[var(--text-secondary)] group-hover:text-[var(--accent)] group-hover:bg-[var(--accent-glow)] rounded-full flex items-center justify-center mb-4 transition-colors">
            <UploadCloud size={28} />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Drag and drop files</h3>
          <p className="text-sm text-[var(--text-muted)] max-w-[250px]">
            Support for PDF, DOCX, TXT, and CSV files up to 50MB. Max 20 files at once.
          </p>
          <button className="btn btn-secondary mt-6">Browse Files</button>
        </div>

        {/* Sync Status / Overview */}
        <div className="lg:col-span-2 card p-6 flex flex-col">
          <h3 className="font-semibold text-[var(--text-primary)] mb-6">Processing Status</h3>
          
          <div className="flex gap-4 mb-8 flex-wrap">
            <div className="flex-1 bg-[var(--surface-active)] rounded-lg p-4 border border-[var(--border)]">
              <span className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Total Vectors</span>
              <span className="text-3xl font-mono font-bold text-[var(--text-primary)]">14,291</span>
            </div>
            <div className="flex-1 bg-[var(--surface-active)] rounded-lg p-4 border border-[var(--border)]">
              <span className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Documents Active</span>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-[var(--success)]">12</span>
                <span className="text-sm font-medium text-[var(--text-secondary)] mb-1">/ 13</span>
              </div>
            </div>
          </div>

          <h3 className="font-semibold text-[var(--text-primary)] mb-4">Recent Documents</h3>
          <div className="flex-1 overflow-auto rounded-lg border border-[var(--border)]">
            <table className="w-full">
              <thead className="bg-[var(--surface-active)] sticky top-0">
                <tr>
                  <th className="py-2.5">File Name</th>
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right pr-4">Size</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--surface-hover)]">
                    <td className="py-2.5">
                      <div className="flex items-center gap-3">
                        <FileText size={16} className={doc.type === "PDF" ? "text-red-500" : doc.type === "DOCX" ? "text-blue-500" : "text-gray-400"} />
                        <span className="text-sm font-medium text-[var(--text-primary)]">{doc.title}</span>
                        <span className="text-[10px] bg-[var(--background)] px-1.5 py-0.5 rounded text-[var(--text-muted)] border border-[var(--border)] hidden sm:inline">{doc.type}</span>
                      </div>
                    </td>
                    <td className="py-2.5 text-sm text-[var(--text-secondary)]">{doc.date}</td>
                    <td className="py-2.5">
                      {doc.status === "Processing" ? (
                        <span className="flex items-center gap-1.5 text-xs text-[var(--warning)] font-medium">
                          <RefreshCw size={12} className="animate-spin" /> Processing
                        </span>
                      ) : (
                        <span className="badge badge-success px-2 py-0.5">Active</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right text-sm text-[var(--text-muted)] pr-4">{doc.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
    </div>
  );
}
