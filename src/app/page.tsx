"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/auth-context";
import { useChat } from "@/hooks/use-chat";
import { Sidebar } from "@/components/sidebar/sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { ChatSkeleton } from "@/components/chat/chat-skeleton";
import { EmptyState } from "@/components/chat/empty-state";
import { CloudMixLogo } from "@/components/cloud-mix-logo";
import { SelfProfileModal } from "@/components/modals/self-profile-modal";
import { ProfileInfoModal } from "@/components/modals/profile-info-modal";
import { ChatInfoModal } from "@/components/modals/chat-info-modal";
import { CreateGroupModal } from "@/components/modals/create-group-modal";
import type { Session } from "@/types/auth";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function Home(): React.JSX.Element {
  const { user, isAuthLoading, logout } = useAuth();
  const router = useRouter();

  const [profileInfoOpen, setProfileInfoOpen] = useState(false);
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
    loadMoreMessages,
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
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden overflow-x-hidden bg-white">
      {/* Modals */}
      <ProfileInfoModal
        open={profileInfoOpen}
        user={user}
        onClose={() => {
          setProfileInfoOpen(false);
        }}
        onLogout={logout}
        onEditProfile={openSelfProfile}
      />
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
        {/* Left cell — logo */}
        <div className="flex-shrink-0 flex items-center px-5 py-4 md:w-72 lg:w-80">
          <CloudMixLogo />
        </div>

        {/* Right cell — profile (avatar + name, no logout text) */}
        <div className="flex-1 flex items-center justify-end px-5 border-l border-gray-100">
          <button
            onClick={() => {
              setProfileInfoOpen(true);
            }}
            aria-label="Open profile"
            className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
          >
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-violet-100 hover:ring-violet-300 transition-all"
              />
            ) : (
              <span className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold text-white ring-2 ring-violet-100 hover:ring-violet-300 transition-all">
                {user.username.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="text-sm font-semibold text-gray-900 leading-snug">
              {user.username}
            </span>
          </button>
        </div>
      </header>

      {/* ROW 2 — Main content */}
      <div className="flex flex-1 overflow-hidden">
        <div
          className={[
            "flex-shrink-0 flex-col w-full md:w-72 lg:w-80 h-full",
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
            "flex-col min-w-0 h-full",
            !showSidebar ? "flex flex-1" : "hidden md:flex md:flex-1",
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
                onBack={() => {
                  selectThread(null);
                }}
                onLoadMore={() => void loadMoreMessages(activeThread.id)}
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
