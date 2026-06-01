"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, MessageSquare } from "lucide-react";
import type { ChatThread } from "@/types/chat";
import { ThreadItem } from "./thread-item";

interface SidebarProps {
  threads: ChatThread[];
  activeThreadId: string | null;
  searchQuery: string;
  onSelectThread: (id: string) => void;
  onNewChat: () => void;
  onSearchChange: (q: string) => void;
}

export function Sidebar({
  threads,
  activeThreadId,
  searchQuery,
  onSelectThread,
  onNewChat,
  onSearchChange,
}: SidebarProps): React.JSX.Element {
  return (
    <aside className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800">
      {/* Brand header */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-zinc-800">
        <span className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
          <MessageSquare size={16} className="text-white" />
        </span>
        <span className="text-base font-bold text-white tracking-tight">CloudMix</span>
      </div>

      {/* New chat button */}
      <div className="px-3 pt-4 pb-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-sm font-semibold transition-colors"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <label className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2 border border-zinc-700 focus-within:border-violet-500 transition-colors">
          <Search size={14} className="text-zinc-500 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
            }}
            placeholder="Search chats"
            className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-500 outline-none"
          />
        </label>
      </div>

      {/* Thread list */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        <p className="px-2 pb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
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
                transition={{ duration: 0.2 }}
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
            <li className="px-3 py-6 text-center text-sm text-zinc-500">No chats found</li>
          )}
        </motion.ul>
      </nav>

      {/* Footer user info */}
      <div className="px-4 py-3 border-t border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-violet-700 flex items-center justify-center text-xs font-bold text-white">
            SM
          </span>
          <span className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-100 truncate">Samurai Meow</p>
            <p className="text-xs text-zinc-500">Online</p>
          </span>
        </div>
      </div>
    </aside>
  );
}
