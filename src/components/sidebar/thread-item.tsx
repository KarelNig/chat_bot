"use client";

import { motion } from "framer-motion";
import { Bot, Users, Trash2 } from "lucide-react";
import type { ChatThread } from "@/types/chat";
import { formatTime, getLastMessage } from "@/lib/utils";

interface ThreadItemProps {
  thread: ChatThread;
  isActive: boolean;
  onClick: () => void;
  onDelete?: () => void;
}

export function ThreadItem({
  thread,
  isActive,
  onClick,
  onDelete,
}: ThreadItemProps): React.JSX.Element {
  const preview = getLastMessage(thread.messages);
  const time = formatTime(thread.lastUpdated);
  const unread = (thread.unreadCount ?? 0) > 0;

  return (
    <div className="group relative">
      <motion.button
        layout
        onClick={onClick}
        className={[
          "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors",
          isActive ? "bg-violet-50 ring-1 ring-violet-200" : "hover:bg-gray-50",
        ].join(" ")}
        whileTap={{ scale: 0.98 }}
      >
        {/* Avatar */}
        {thread.type === "ai" ? (
          <span
            className={[
              "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
              isActive ? "bg-violet-600" : "bg-violet-100",
            ].join(" ")}
          >
            <Bot
              size={17}
              className={isActive ? "text-white" : "text-violet-600"}
              strokeWidth={1.8}
            />
          </span>
        ) : thread.type === "group" && thread.avatarUrl ? (
          <img
            src={thread.avatarUrl}
            alt={thread.title}
            className="flex-shrink-0 w-10 h-10 rounded-full object-cover"
          />
        ) : thread.type === "group" ? (
          <span
            className={[
              "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
              isActive ? "bg-violet-600" : "bg-violet-100",
            ].join(" ")}
          >
            <Users
              size={17}
              className={isActive ? "text-white" : "text-violet-600"}
              strokeWidth={1.8}
            />
          </span>
        ) : thread.avatarUrl ? (
          <img
            src={thread.avatarUrl}
            alt={thread.title}
            className="flex-shrink-0 w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <span
            className={[
              "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
              isActive ? "bg-violet-600 text-white" : "bg-violet-100 text-violet-600",
            ].join(" ")}
          >
            {thread.title.slice(0, 1).toUpperCase()}
          </span>
        )}

        {/* Text */}
        <span className="flex-1 min-w-0">
          <span className="flex items-center justify-between gap-2">
            <span
              className={[
                "font-semibold text-sm truncate",
                isActive ? "text-violet-700" : "text-gray-900",
              ].join(" ")}
            >
              {thread.title}
            </span>
            {/* Fade out timestamp on hover to make room for the trash button */}
            <span className="flex-shrink-0 text-xs text-gray-400 tabular-nums group-hover:opacity-0 transition-opacity">
              {time}
            </span>
          </span>
          <span className="flex items-center justify-between gap-2 mt-0.5">
            <span
              className={[
                "block text-xs truncate",
                isActive ? "text-violet-500" : "text-gray-500",
                unread && !isActive ? "font-medium text-gray-700" : "",
              ].join(" ")}
            >
              {preview}
            </span>
            {unread && !isActive && (
              <span className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white px-1">
                {thread.unreadCount}
              </span>
            )}
          </span>
        </span>
      </motion.button>

      {/* Delete button — AI threads only, revealed on group-hover */}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete chat"
          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <Trash2 size={14} strokeWidth={1.8} />
        </button>
      )}
    </div>
  );
}
