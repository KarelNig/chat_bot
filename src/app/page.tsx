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
    draftThread,
    searchQuery,
    isBotTyping,
    selectThread,
    setSearchQuery,
    startNewDraft,
    sendMessage,
  } = useChat();

  const showSidebar = activeThreadId === null && draftThread === null;

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div
        className={[
          "flex-shrink-0 flex flex-col w-full md:w-72 lg:w-80 h-full",
          showSidebar ? "flex" : "hidden md:flex",
        ].join(" ")}
      >
        <Sidebar
          threads={filteredThreads}
          activeThreadId={activeThreadId}
          draftActive={draftThread !== null}
          searchQuery={searchQuery}
          onSelectThread={(id) => {
            selectThread(id);
          }}
          onNewChat={startNewDraft}
          onSearchChange={(q) => {
            setSearchQuery(q);
          }}
        />
      </div>

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
              isDraft={draftThread !== null && activeThread.id === draftThread.id}
              isBotTyping={isBotTyping}
              onBack={() => {
                selectThread(null);
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
