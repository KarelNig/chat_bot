"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Bot } from "lucide-react";
import type { ChatThread } from "@/types/chat";
import { MessagesArea } from "./messages-area";
import { MessageInput } from "./message-input";

interface ChatWindowProps {
  thread: ChatThread;
  isDraft: boolean;
  isBotTyping: boolean;
  onBack: () => void;
  onSend: (text: string) => void;
}

export function ChatWindow({
  thread,
  isDraft,
  isBotTyping,
  onBack,
  onSend,
}: ChatWindowProps): React.JSX.Element {
  const label = isDraft ? "New Chat" : (thread.participantName ?? thread.title);

  const statusLabel = isDraft ? "Start a conversation" : isBotTyping ? "Typing..." : "Online";

  return (
    <motion.div
      key={thread.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col h-full bg-white"
    >
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-200 bg-white flex-shrink-0">
        <button
          onClick={onBack}
          aria-label="Back to chat list"
          className="md:hidden flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        <span className="flex-shrink-0 w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center">
          <Bot size={16} className="text-white" />
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{label}</p>
          <p
            className={[
              "text-xs font-medium transition-colors",
              isDraft ? "text-violet-500" : isBotTyping ? "text-violet-500" : "text-emerald-500",
            ].join(" ")}
          >
            {statusLabel}
          </p>
        </div>
      </header>

      {isDraft && (
        <div className="mx-4 mt-4 px-4 py-3 rounded-xl bg-violet-50 border border-violet-100 text-sm text-violet-700 text-center">
          This conversation will appear in your history after you send the first message.
        </div>
      )}

      <MessagesArea messages={thread.messages} isBotTyping={isBotTyping} />
      <MessageInput onSend={onSend} />
    </motion.div>
  );
}
