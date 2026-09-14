"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Bot, User } from "lucide-react";

type ConversationItem = {
  id: string;
  customer_id: string;
  status: string;
  ai_mode: boolean;
  unread_count: number;
  last_message_preview: string;
  last_message_at: string | null;
  customers?: { id: string; name: string; profile_pic_url?: string | null; psid?: string | null; tags?: string[] };
};

export function ConversationList({ selectedConversationId, onSelect }: { selectedConversationId: string | null; onSelect: (id: string) => void }) {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "ai">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (filter === "unread") params.set("unread", "true");
        if (filter === "ai") params.set("ai_mode", "true");
        params.set("limit", "50");

        const response = await fetch(`/api/conversations?${params.toString()}`, { credentials: "same-origin" });
        if (!response.ok) {
          setConversations([]);
          return;
        }

        const payload = await response.json();
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        setConversations(rows);
        if (!selectedConversationId && rows.length) onSelect(rows[0].id);
      } catch {
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [query, filter, selectedConversationId, onSelect]);

  const visible = useMemo(() => conversations, [conversations]);

  return (
    <div className="flex flex-col h-full bg-[var(--surface)] border-r border-[var(--border)] w-full">
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Inbox</h2>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={query}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="flex gap-2 mt-4">
          <button className={`px-3 py-1 text-xs font-semibold rounded-full ${filter === "all" ? "bg-[var(--accent-glow)] text-[var(--accent)]" : "bg-[var(--surface-active)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`} onClick={() => setFilter("all")}>All</button>
          <button className={`px-3 py-1 text-xs font-semibold rounded-full ${filter === "unread" ? "bg-[var(--accent-glow)] text-[var(--accent)]" : "bg-[var(--surface-active)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`} onClick={() => setFilter("unread")}>Unread</button>
          <button className={`px-3 py-1 text-xs font-semibold rounded-full ${filter === "ai" ? "bg-[var(--accent-glow)] text-[var(--accent)]" : "bg-[var(--surface-active)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`} onClick={() => setFilter("ai")}> <Bot size={12} className="inline mr-1" />AI Handled</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && <div className="p-4 text-sm text-[var(--text-muted)]">Loading conversations...</div>}
        {!loading && visible.length === 0 && <div className="p-4 text-sm text-[var(--text-muted)]">No conversations found</div>}
        {visible.map((conv) => {
          const customer = conv.customers?.name ?? "Customer";
          const isSelected = selectedConversationId === conv.id;
          return (
            <div
              key={conv.id}
              className={`p-4 border-b border-[var(--border)] hover:bg-[var(--surface-hover)] cursor-pointer transition-colors ${isSelected ? 'bg-[var(--surface-active)] border-l-2 border-l-[var(--accent)]' : 'border-l-2 border-l-transparent'}`}
              onClick={() => onSelect(conv.id)}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-sm text-[var(--text-primary)]">{customer}</h3>
                <span className="text-[10px] font-medium text-[var(--text-muted)]">{conv.last_message_at ? new Date(conv.last_message_at).toLocaleTimeString() : ""}</span>
              </div>

              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-[var(--text-secondary)] truncate pr-4 w-full">{conv.last_message_preview ?? ""}</p>

                <div className="flex items-center gap-1.5 shrink-0">
                  {conv.ai_mode ? (
                    <Bot size={14} className="text-[var(--success)]" />
                  ) : (
                    <User size={14} className="text-[var(--info)]" />
                  )}
                  {conv.unread_count > 0 && (
                    <span className="bg-[var(--accent)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
