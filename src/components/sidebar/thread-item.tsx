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
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors",
        isActive ? "bg-violet-50 ring-1 ring-violet-200" : "hover:bg-gray-100 text-gray-700",
      ].join(" ")}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Avatar */}
      <span
        className={[
          "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold",
          thread.type === "ai" ? "bg-violet-600 text-white" : "bg-gray-200 text-gray-600",
        ].join(" ")}
      >
        {thread.type === "ai" ? "AI" : initials}
      </span>

      {/* Text */}
      <span className="flex-1 min-w-0">
        <span className="flex items-center justify-between gap-1">
          <span
            className={[
              "font-medium text-sm truncate",
              isActive ? "text-violet-800" : "text-gray-900",
            ].join(" ")}
          >
            {thread.title}
          </span>
          <span className="flex-shrink-0 text-xs text-gray-400">{time}</span>
        </span>
        <span
          className={[
            "block text-xs truncate mt-0.5",
            isActive ? "text-violet-600" : "text-gray-500",
          ].join(" ")}
        >
          {preview}
        </span>
      </span>
    </motion.button>
  );
}
