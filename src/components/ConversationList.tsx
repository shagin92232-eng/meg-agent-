import { Search, Bot, User } from "lucide-react";

export function ConversationList() {
  const mockConversations = [
    { id: 1, name: "Alice Johnson", lastMessage: "Where is my order?", time: "10:32 AM", unread: 2, aiMode: true },
    { id: 2, name: "Bob Smith", lastMessage: "Thanks for the help!", time: "09:15 AM", unread: 0, aiMode: false },
    { id: 3, name: "Charlie Brown", lastMessage: "Do you have this in blue?", time: "Yesterday", unread: 0, aiMode: true },
    { id: 4, name: "Diana Prince", lastMessage: "I need to return an item.", time: "Yesterday", unread: 1, aiMode: false },
    { id: 5, name: "Evan Wright", lastMessage: "Shipping took too long", time: "Monday", unread: 0, aiMode: true },
  ];

  return (
    <div className="flex flex-col h-full bg-[var(--surface)] border-r border-[var(--border)] w-full">
      <div className="p-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">Inbox</h2>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input 
            type="text" 
            placeholder="Search conversations..." 
            className="w-full pl-9 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-md text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          />
        </div>
        
        <div className="flex gap-2 mt-4">
          <button className="px-3 py-1 text-xs font-semibold rounded-full bg-[var(--accent-glow)] text-[var(--accent)]">All</button>
          <button className="px-3 py-1 text-xs font-semibold rounded-full bg-[var(--surface-active)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Unread</button>
          <button className="px-3 py-1 text-xs font-semibold rounded-full bg-[var(--surface-active)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><Bot size={12} className="inline mr-1" />AI Handled</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {mockConversations.map((conv) => (
          <div 
            key={conv.id} 
            className={`p-4 border-b border-[var(--border)] hover:bg-[var(--surface-hover)] cursor-pointer transition-colors ${conv.id === 1 ? 'bg-[var(--surface-active)] border-l-2 border-l-[var(--accent)]' : 'border-l-2 border-l-transparent'}`}
          >
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-semibold text-sm text-[var(--text-primary)]">{conv.name}</h3>
              <span className="text-[10px] font-medium text-[var(--text-muted)]">{conv.time}</span>
            </div>
            
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-[var(--text-secondary)] truncate pr-4 w-full">
                {conv.lastMessage}
              </p>
              
              <div className="flex items-center gap-1.5 shrink-0">
                {conv.aiMode ? (
                  <Bot size={14} className="text-[var(--success)]" />
                ) : (
                  <User size={14} className="text-[var(--info)]" />
                )}
                {conv.unread > 0 && (
                  <span className="bg-[var(--accent)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {conv.unread}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
