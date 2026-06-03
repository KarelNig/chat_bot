"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useChat } from "@/hooks/use-chat";
import { Sidebar } from "@/components/sidebar/sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { ChatSkeleton } from "@/components/chat/chat-skeleton";
import { EmptyState } from "@/components/chat/empty-state";
import { CloudMixLogo } from "@/components/cloud-mix-logo";
import { SelfProfileModal } from "@/components/modals/self-profile-modal";
import { ChatInfoModal } from "@/components/modals/chat-info-modal";
import { CreateGroupModal } from "@/components/modals/create-group-modal";
import type { Session } from "@/types/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function Home(): React.JSX.Element {
  const { user, isAuthLoading, logout } = useAuth();
  const router = useRouter();

  const [selfProfileOpen, setSelfProfileOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace("/login");
    }
  }, [isAuthLoading, user, router]);

  const userId = user?.id ?? null;

  const {
    filteredThreads,
    activeThreadId,
    activeThread,
    draftThread,
    searchQuery,
    isLoading,
    isBotTyping,
    selectThread,
    setSearchQuery,
    startNewDraft,
    startP2PChat,
    createGroup,
    sendMessage,
    updateThread,
    deleteThread,
  } = useChat(userId);

  if (isAuthLoading || !user) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="w-6 h-6 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isLoading) {
    return <ChatSkeleton />;
  }

  const showSidebar = activeThreadId === null && draftThread === null;
  const mobileBackLabel = activeThread?.title ?? "New Chat";

  const handleSelectUser = (peer: Session): void => {
    void startP2PChat(peer);
  };

  const handleCreateGroup = (title: string, memberIds: string[]): void => {
    void createGroup(title, memberIds);
  };

  const openSelfProfile = (): void => {
    if (isSupabaseConfigured) setSelfProfileOpen(true);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white">
      {/* Modals */}
      <SelfProfileModal
        open={selfProfileOpen}
        onClose={() => {
          setSelfProfileOpen(false);
        }}
      />
      <ChatInfoModal
        open={infoModalOpen}
        thread={activeThread}
        currentUserId={user.id}
        onClose={() => {
          setInfoModalOpen(false);
        }}
        onUpdateThread={updateThread}
      />
      {isSupabaseConfigured && (
        <CreateGroupModal
          open={createGroupOpen}
          currentUserId={user.id}
          onClose={() => {
            setCreateGroupOpen(false);
          }}
          onCreate={handleCreateGroup}
        />
      )}

      {/* ROW 1 — Global top header */}
      <header className="flex-shrink-0 flex items-stretch border-b border-gray-100 bg-white">
        {/* Left cell */}
        <div className="flex-shrink-0 flex items-center px-5 py-4 md:w-72 lg:w-80">
          {!showSidebar && (
            <button
              onClick={() => {
                selectThread(null);
              }}
              aria-label="Back to chat list"
              className="md:hidden flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={16} strokeWidth={2.5} />
              <span className="truncate max-w-[180px]">{mobileBackLabel}</span>
            </button>
          )}
          <div className={!showSidebar ? "hidden md:block" : "block"}>
            <CloudMixLogo />
          </div>
        </div>

        {/* Right cell: avatar + username + logout */}
        <div className="flex-1 flex items-center justify-end gap-3 px-5 border-l border-gray-100">
          {/* Circular avatar */}
          <button
            onClick={openSelfProfile}
            aria-label="Edit profile"
            className="flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 rounded-full"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-violet-100 hover:ring-violet-300 transition-all"
              />
            ) : (
              <span className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold text-white ring-2 ring-violet-100 hover:ring-violet-300 transition-all">
                {user.username.slice(0, 1).toUpperCase()}
              </span>
            )}
          </button>

          {/* Text block */}
          <div className="flex flex-col items-end">
            <button
              onClick={openSelfProfile}
              className="text-sm font-semibold text-gray-900 leading-snug hover:text-violet-700 transition-colors"
            >
              {user.username}
            </button>
            <button
              onClick={logout}
              className="mt-0.5 text-xs font-medium text-violet-600 hover:text-violet-700 transition-colors leading-snug"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* ROW 2 — Main content */}
      <div className="flex flex-1 overflow-hidden">
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
            currentUserId={user.id}
            onSelectThread={selectThread}
            onNewChat={startNewDraft}
            onNewGroup={() => {
              setCreateGroupOpen(true);
            }}
            onSelectUser={handleSelectUser}
            onSearchChange={setSearchQuery}
            onDeleteThread={(id) => void deleteThread(id)}
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
                currentUserId={user.id}
                onSend={sendMessage}
                onHeaderClick={() => {
                  setInfoModalOpen(true);
                }}
              />
            ) : (
              <EmptyState key="empty" />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
