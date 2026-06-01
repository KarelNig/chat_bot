"use client";

import { AnimatePresence } from "framer-motion";
import { useChat } from "@/hooks/use-chat";
import { Sidebar } from "@/components/sidebar/sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { EmptyState } from "@/components/chat/empty-state";

export default function Home(): React.JSX.Element {
  const {
    filteredThreads,
    activeThreadId,
    activeThread,
    searchQuery,
    setActiveThreadId,
    setSearchQuery,
    createNewThread,
    sendMessage,
  } = useChat();

  const showSidebar = activeThreadId === null;

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Sidebar: full-width on mobile when no thread active, fixed column on desktop */}
      <div
        className={[
          "flex-shrink-0 flex flex-col w-full md:w-72 lg:w-80 h-full",
          showSidebar ? "flex" : "hidden md:flex",
        ].join(" ")}
      >
        <Sidebar
          threads={filteredThreads}
          activeThreadId={activeThreadId}
          searchQuery={searchQuery}
          onSelectThread={(id) => {
            setActiveThreadId(id);
          }}
          onNewChat={createNewThread}
          onSearchChange={(q) => {
            setSearchQuery(q);
          }}
        />
      </div>

      {/* Chat pane: full-width on mobile when thread active, flex-1 on desktop */}
      <div
        className={[
          "flex-1 flex flex-col min-w-0 h-full",
          !showSidebar ? "flex" : "hidden md:flex",
        ].join(" ")}
      >
        <AnimatePresence mode="wait">
          {activeThread ? (
            <ChatWindow
              key={activeThread.id}
              thread={activeThread}
              onBack={() => {
                setActiveThreadId(null);
              }}
              onSend={sendMessage}
            />
          ) : (
            <EmptyState key="empty" />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
