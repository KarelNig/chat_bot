"use client";

import { motion } from "framer-motion";
import type { ChatThread } from "@/types/chat";
import { formatTime, getLastMessage } from "@/lib/utils";

interface ThreadItemProps {
  thread: ChatThread;
  isActive: boolean;
  onClick: () => void;
}

export function ThreadItem({ thread, isActive, onClick }: ThreadItemProps): React.JSX.Element {
  const preview = getLastMessage(thread.messages);
  const time = formatTime(thread.lastUpdated);
  const label = thread.participantName ?? thread.title;
  const initials = label.slice(0, 2).toUpperCase();

  return (
    <motion.button
      layout
      onClick={onClick}
      className={[
        "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors",
        isActive ? "bg-violet-600/15 text-violet-50" : "hover:bg-white/5 text-zinc-300",
      ].join(" ")}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Avatar */}
      <span
        className={[
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold",
          thread.type === "ai" ? "bg-violet-600 text-white" : "bg-zinc-700 text-zinc-200",
        ].join(" ")}
      >
        {thread.type === "ai" ? "AI" : initials}
      </span>

      {/* Text */}
      <span className="flex-1 min-w-0">
        <span className="flex items-center justify-between gap-1">
          <span className="font-medium text-sm truncate text-zinc-100">{thread.title}</span>
          <span className="flex-shrink-0 text-xs text-zinc-500">{time}</span>
        </span>
        <span className="block text-xs text-zinc-400 truncate mt-0.5">{preview}</span>
      </span>
    </motion.button>
  );
}
