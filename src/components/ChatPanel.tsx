"use client";

import { useEffect, useState } from "react";
import { Send, Image as ImageIcon, Paperclip, Bot, User, MoreVertical } from "lucide-react";

type Message = {
  id: string;
  sender_role: "customer" | "ai" | "human";
  content: string | null;
  created_at: string;
  status?: string;
};

export function ChatPanel({ conversationId }: { conversationId: string | null }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadMessages = async () => {
    if (!conversationId) return;
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, { credentials: "same-origin" });
      if (!response.ok) {
        setMessages([]);
        return;
      }
      const payload = await response.json();
      setMessages(Array.isArray(payload?.data) ? payload.data : []);
    } catch {
      setMessages([]);
    }
  };

  useEffect(() => {
    void loadMessages();
  }, [conversationId]);

  const sendMessage = async () => {
    if (!conversationId || !messageText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: messageText.trim() }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload?.error ?? "Unable to send message.");
        return;
      }
      setMessageText("");
      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background)] w-full">
      <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
        <div className="flex items-center gap-3">
          <div className="avatar avatar-md border border-[var(--border-light)]">
            {conversationId ? conversationId.slice(0, 2).toUpperCase() : "IN"}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Conversation</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-[var(--success)] rounded-full animate-pulse"></span>
              <span className="text-[10px] text-[var(--text-muted)] font-medium">Online via Messenger</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-active)] border border-[var(--border-light)] rounded-full">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Mode:</span>
            <button className="flex items-center gap-1 text-xs font-bold text-white bg-[var(--success)] px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]">
              <Bot size={12} /> AI Auto
            </button>
          </div>
          <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <div className="text-center">
          <span className="text-xs font-medium text-[var(--text-muted)] bg-[var(--surface)] px-3 py-1 rounded-full border border-[var(--border)]">
            {conversationId ? "Conversation" : "No conversation selected"}
          </span>
        </div>

        {error && <div className="text-xs text-[var(--danger)]">{error}</div>}

        {messages.map((m) => {
          const isCustomer = m.sender_role === "customer" || m.sender_role === "human" ? false : false;
          const isAI = m.sender_role === "ai";
          const isCustomerMessage = m.sender_role === "customer";
          return (
            <div key={m.id} className={`flex max-w-[80%] ${isCustomerMessage ? "self-start" : "self-end flex-row-reverse"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mx-2 mt-1 ${isCustomerMessage ? "bg-[var(--surface-active)] text-[var(--text-secondary)]" : "bg-[var(--accent)] text-white"}`}>
                {isCustomerMessage ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div className={`flex flex-col ${isCustomerMessage ? "items-start" : "items-end"}`}>
                <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                  isCustomerMessage
                    ? "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-sm"
                    : "bg-[var(--accent)] text-white rounded-tr-sm"
                }`}>
                  {m.content ?? ""}
                </div>
                <span className="text-[10px] text-[var(--text-muted)] mt-1 px-1 font-medium">
                  {m.created_at ? new Date(m.created_at).toLocaleTimeString() : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] shrink-0">
        <div className="flex flex-col gap-2 p-1 bg-[var(--background)] border border-[var(--border)] rounded-xl focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_3px_var(--accent-glow)] transition-all">
          <textarea
            value={messageText}
            placeholder="Type your message..."
            className="w-full bg-transparent border-none outline-none resize-none h-14 p-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]"
            onChange={(event) => setMessageText(event.target.value)}
          />
          <div className="flex justify-between items-center px-2 pb-2">
            <div className="flex gap-1">
              <button className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent-glow)] rounded-md transition-colors">
                <ImageIcon size={18} />
              </button>
              <button className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--accent-glow)] rounded-md transition-colors">
                <Paperclip size={18} />
              </button>
            </div>
            <button onClick={sendMessage} disabled={loading || !conversationId} className="flex items-center justify-center w-8 h-8 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-all hover:scale-105 active:scale-95 shadow-md shadow-[var(--accent-glow)]">
              <Send size={14} className="-ml-0.5 mt-0.5" />
            </button>
          </div>
        </div>
        <p className="text-[10px] text-center text-[var(--text-muted)] mt-2 font-medium">
          Sending a message will automatically switch mode to Human.
        </p>
      </div>
    </div>
  );
}
