"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { useChat } from "@/hooks/use-chat";
import { Sidebar } from "@/components/sidebar/sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { EmptyState } from "@/components/chat/empty-state";
import { CURRENT_USER_ID } from "@/types/chat";

export default function Home(): React.JSX.Element {
  const { user, isAuthLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace("/login");
    }
  }, [isAuthLoading, user, router]);

  const userId = user?.id ?? CURRENT_USER_ID;

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
    startP2PThread,
    sendMessage,
  } = useChat(userId);

  // Show spinner during hydration and while session is being read
  if (isAuthLoading || !user) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
      </div>
    );
  }

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
          currentUser={user}
          onSelectThread={(id) => {
            selectThread(id);
          }}
          onNewChat={startNewDraft}
          onSearchChange={(q) => {
            setSearchQuery(q);
          }}
          onStartP2PThread={startP2PThread}
          onLogout={logout}
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
              currentUserId={userId}
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
