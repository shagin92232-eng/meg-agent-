import { Send, Image as ImageIcon, Paperclip, Bot, User, MoreVertical } from "lucide-react";

export function ChatPanel() {
  const msgs = [
    { id: 1, sender: "customer", text: "Hi, I have a problem with my recent order #10042", time: "10:30 AM" },
    { id: 2, sender: "ai", text: "Hello Alice! I'm the AI assistant for Meg Auto. I can help you with order #10042. What seems to be the issue?", time: "10:30 AM" },
    { id: 3, sender: "customer", text: "The item I received is missing a part.", time: "10:32 AM" },
  ];

  return (
    <div className="flex flex-col h-full bg-[var(--background)] w-full">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--border)] bg-[var(--surface)] shrink-0">
        <div className="flex items-center gap-3">
          <div className="avatar avatar-md border border-[var(--border-light)]">
            AJ
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Alice Johnson</h2>
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

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        <div className="text-center">
          <span className="text-xs font-medium text-[var(--text-muted)] bg-[var(--surface)] px-3 py-1 rounded-full border border-[var(--border)]">
            Today
          </span>
        </div>

        {msgs.map((m) => {
          const isCustomer = m.sender === "customer";
          return (
            <div key={m.id} className={`flex max-w-[80%] ${isCustomer ? "self-start" : "self-end flex-row-reverse"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mx-2 mt-1 ${isCustomer ? "bg-[var(--surface-active)] text-[var(--text-secondary)]" : "bg-[var(--accent)] text-white"}`}>
                {isCustomer ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              <div className={`flex flex-col ${isCustomer ? "items-start" : "items-end"}`}>
                <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                  isCustomer 
                    ? "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-sm"
                    : "bg-[var(--accent)] text-white rounded-tr-sm"
                }`}>
                  {m.text}
                </div>
                <span className="text-[10px] text-[var(--text-muted)] mt-1 px-1 font-medium">
                  {m.time}
                </span>
              </div>
            </div>
          )
        })}
        {/* Typing indicator */}
        <div className="flex max-w-[80%] self-end flex-row-reverse opacity-0 animate-fade-in delay-5">
           <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mx-2 mt-1 bg-[var(--accent)] text-white`}>
            <Bot size={16} />
          </div>
          <div className="px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl rounded-tr-sm flex gap-1">
            <div className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-[var(--text-muted)] rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] shrink-0">
        <div className="flex flex-col gap-2 p-1 bg-[var(--background)] border border-[var(--border)] rounded-xl focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_3px_var(--accent-glow)] transition-all">
          <textarea 
            placeholder="Type your message..." 
            className="w-full bg-transparent border-none outline-none resize-none h-14 p-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]"
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
            <button className="flex items-center justify-center w-8 h-8 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-all hover:scale-105 active:scale-95 shadow-md shadow-[var(--accent-glow)]">
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
