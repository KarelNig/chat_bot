"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, MessageSquare } from "lucide-react";
import type { ChatThread } from "@/types/chat";
import { ThreadItem } from "./thread-item";

interface SidebarProps {
  threads: ChatThread[];
  activeThreadId: string | null;
  draftActive: boolean;
  searchQuery: string;
  onSelectThread: (id: string) => void;
  onNewChat: () => void;
  onSearchChange: (q: string) => void;
}

export function Sidebar({
  threads,
  activeThreadId,
  draftActive,
  searchQuery,
  onSelectThread,
  onNewChat,
  onSearchChange,
}: SidebarProps): React.JSX.Element {
  return (
    <aside className="flex flex-col h-full bg-gray-50 border-r border-gray-200">
      {/* Brand header */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-gray-200">
        <span className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
          <MessageSquare size={16} className="text-white" />
        </span>
        <span className="text-base font-bold text-gray-900 tracking-tight">Zimran Chat</span>
      </div>

      {/* New chat button */}
      <div className="px-3 pt-4 pb-2">
        <button
          onClick={onNewChat}
          className={[
            "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors",
            draftActive
              ? "bg-violet-100 text-violet-700 ring-2 ring-violet-300"
              : "bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white",
          ].join(" ")}
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <label className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-200 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
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

      {/* Thread list */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        <p className="px-2 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Messages ({threads.length})
        </p>
        <motion.ul layout className="flex flex-col gap-0.5">
          <AnimatePresence initial={false}>
            {threads.map((thread) => (
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
                />
              </motion.li>
            ))}
          </AnimatePresence>
          {threads.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-gray-400">No chats found</li>
          )}
        </motion.ul>
      </nav>

      {/* Footer: user profile */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            G
          </span>
          <span className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">Guest</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </span>
        </div>
      </div>
    </aside>
  );
}
