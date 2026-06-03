"use client";

import { motion } from "framer-motion";
import { Bot, Users } from "lucide-react";
import type { ChatThread } from "@/types/chat";
import type { AiModelId } from "@/types/ai-model";
import { MessagesArea } from "./messages-area";
import { MessageInput } from "./message-input";

interface ChatWindowProps {
  thread: ChatThread;
  isDraft: boolean;
  isBotTyping: boolean;
  currentUserId: string;
  onSend: (text: string, modelId?: AiModelId) => void;
  onHeaderClick: () => void;
}

export function ChatWindow({
  thread,
  isDraft,
  isBotTyping,
  currentUserId,
  onSend,
  onHeaderClick,
}: ChatWindowProps): React.JSX.Element {
  const label = isDraft ? "New Chat" : thread.title;

  const statusLabel = isDraft
    ? "Start a conversation"
    : thread.type === "ai"
      ? isBotTyping
        ? "Typing…"
        : "Online"
      : thread.type === "group"
        ? "Group · tap to see members"
        : "Direct message · tap to view profile";

  const statusClass =
    isDraft || (thread.type === "ai" && isBotTyping)
      ? "text-violet-500"
      : thread.type === "ai"
        ? "text-emerald-500"
        : "text-gray-400";

  return (
    <motion.div
      key={thread.id}
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col h-full bg-white"
    >
      {/* Chat header — clickable to open info modal */}
      <button
        onClick={onHeaderClick}
        className="flex-shrink-0 flex items-center gap-3 px-5 py-3.5 bg-white w-full text-left hover:bg-gray-50 transition-colors"
      >
        {isDraft || thread.type === "ai" ? (
          <span className="flex-shrink-0 w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center">
            <Bot size={16} className="text-white" strokeWidth={1.8} />
          </span>
        ) : thread.type === "group" && thread.avatarUrl ? (
          <img
            src={thread.avatarUrl}
            alt={label}
            className="flex-shrink-0 w-9 h-9 rounded-full object-cover"
          />
        ) : thread.type === "group" ? (
          <span className="flex-shrink-0 w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center">
            <Users size={16} className="text-white" strokeWidth={1.8} />
          </span>
        ) : thread.avatarUrl ? (
          <img
            src={thread.avatarUrl}
            alt={label}
            className="flex-shrink-0 w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <span className="flex-shrink-0 w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold text-white">
            {label.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div>
          <p className="text-sm font-semibold text-gray-900 leading-tight">{label}</p>
          <p className={["text-xs font-medium leading-tight mt-0.5", statusClass].join(" ")}>
            {statusLabel}
          </p>
        </div>
      </button>

      {/* Separator line between bot header and message stream */}
      <div className="flex-shrink-0 border-b border-gray-100" />

      {isDraft && (
        <div className="mx-4 mt-4 px-4 py-3 rounded-xl bg-violet-50 border border-violet-100 text-sm text-violet-700 text-center flex-shrink-0">
          This conversation will appear in your history after you send the first message.
        </div>
      )}

      {/* Message stream */}
      <MessagesArea
        messages={thread.messages}
        isBotTyping={isBotTyping}
        currentUserId={currentUserId}
      />

      {/* Input bar */}
      <MessageInput onSend={onSend} isAiThread={isDraft || thread.type === "ai"} />
    </motion.div>
  );
}
