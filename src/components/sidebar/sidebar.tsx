"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Users } from "lucide-react";
import type { ChatThread } from "@/types/chat";
import type { Session } from "@/types/auth";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ThreadItem } from "./thread-item";
import { UserSearch } from "./user-search";

type ActiveTab = "ai" | "messages";

interface SidebarProps {
  threads: ChatThread[];
  activeThreadId: string | null;
  draftActive: boolean;
  searchQuery: string;
  currentUserId: string;
  onSelectThread: (id: string) => void;
  onNewChat: () => void;
  onNewGroup: () => void;
  onSelectUser: (user: Session) => void;
  onSearchChange: (q: string) => void;
  onDeleteThread: (id: string) => void;
}

export function Sidebar({
  threads,
  activeThreadId,
  draftActive,
  searchQuery,
  currentUserId,
  onSelectThread,
  onNewChat,
  onNewGroup,
  onSelectUser,
  onSearchChange,
  onDeleteThread,
}: SidebarProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<ActiveTab>("messages");

  const displayed = threads.filter((t) =>
    activeTab === "ai" ? t.type === "ai" : t.type === "p2p" || t.type === "group",
  );

  return (
    <aside className="flex flex-col h-full bg-white border-r border-gray-100 overflow-hidden">
      {/* Action buttons */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2.5 flex gap-2">
        <button
          onClick={onNewChat}
          className={[
            "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-semibold transition-all",
            draftActive
              ? "bg-violet-100 text-violet-700 ring-2 ring-violet-200"
              : "bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white shadow-sm",
          ].join(" ")}
        >
          <Plus size={14} strokeWidth={2.5} />
          New Chat
        </button>
        {isSupabaseConfigured && (
          <button
            onClick={onNewGroup}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-semibold transition-all bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-700"
          >
            <Users size={14} strokeWidth={2} />
            New Group
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="flex-shrink-0 px-4 pb-3">
        <label className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3.5 py-2.5 border border-gray-200 focus-within:border-violet-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-violet-100 transition-all">
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
            }}
            placeholder="Search chats"
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
          />
        </label>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 px-4 pb-3">
        <div className="flex rounded-xl bg-gray-100 p-1 gap-1">
          {(["ai", "messages"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
              }}
              className={[
                "flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all",
                activeTab === tab
                  ? "bg-white text-violet-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              ].join(" ")}
            >
              {tab === "ai" ? "AI Bots" : "Messages"}
            </button>
          ))}
        </div>
      </div>

      {/* Thread list */}
      <nav className="flex-1 overflow-y-auto px-3 pb-2">
        <motion.ul layout className="flex flex-col gap-0.5">
          <AnimatePresence initial={false}>
            {displayed.map((thread) => (
              <motion.li
                key={thread.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
              >
                <ThreadItem
                  thread={thread}
                  isActive={thread.id === activeThreadId}
                  onClick={() => {
                    onSelectThread(thread.id);
                  }}
                  onDelete={
                    thread.type === "ai"
                      ? () => {
                          onDeleteThread(thread.id);
                        }
                      : undefined
                  }
                />
              </motion.li>
            ))}
          </AnimatePresence>
          {displayed.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-gray-400">
              {activeTab === "ai" ? "No AI chats yet" : "No conversations yet"}
            </li>
          )}
        </motion.ul>
      </nav>

      {/* Find People — Messages tab only */}
      {activeTab === "messages" && (
        <div className="flex-shrink-0 border-t border-gray-100 pt-1 pb-1">
          <UserSearch currentUserId={currentUserId} onSelectUser={onSelectUser} />
        </div>
      )}
    </aside>
  );
}
