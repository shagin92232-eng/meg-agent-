import { ConversationList } from "@/components/ConversationList";
import { ChatPanel } from "@/components/ChatPanel";
import { CustomerProfile } from "@/components/CustomerProfile";

export default function ConversationsPage() {
  return (
    <div className="h-[calc(100vh-var(--header-height)-2rem)] lg:h-[calc(100vh-var(--header-height)-4rem)] -m-4 lg:-m-8 flex rounded-xl border border-[var(--border-light)] overflow-hidden shadow-2xl animate-scale-in">
      
      {/* 25% Width - List */}
      <div className="hidden md:block w-1/3 lg:w-1/4 h-full">
        <ConversationList />
      </div>

      {/* 50% Width - Panel */}
      <div className="w-full md:w-2/3 lg:w-2/4 h-full flex flex-col relative shadow-[0_0_20px_rgba(0,0,0,0.5)] z-10">
        <ChatPanel />
      </div>

      {/* 25% Width - Profile */}
      <div className="hidden lg:block lg:w-1/4 h-full relative z-0">
        <CustomerProfile />
      </div>
      
    </div>
  );
}
