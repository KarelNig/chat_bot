"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Bot, User } from "lucide-react";
import type { ChatThread } from "@/types/chat";
import { MessagesArea } from "./messages-area";
import { MessageInput } from "./message-input";

interface ChatWindowProps {
  thread: ChatThread;
  onBack: () => void;
  onSend: (text: string) => void;
}

export function ChatWindow({ thread, onBack, onSend }: ChatWindowProps): React.JSX.Element {
  const statusLabel = thread.type === "ai" ? "AI Bot Ready" : "Online";
  const label = thread.participantName ?? thread.title;

  return (
    <motion.div
      key={thread.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full bg-zinc-950"
    >
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
        {/* Back button — mobile only */}
        <button
          onClick={onBack}
          aria-label="Back to chat list"
          className="md:hidden flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Avatar */}
        <span
          className={[
            "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold",
            thread.type === "ai" ? "bg-violet-600 text-white" : "bg-zinc-700 text-zinc-200",
          ].join(" ")}
        >
          {thread.type === "ai" ? <Bot size={16} /> : <User size={16} />}
        </span>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-100 truncate">{label}</p>
          <p className="text-xs text-emerald-400 font-medium">{statusLabel}</p>
        </div>
      </header>

      {/* Messages */}
      <MessagesArea messages={thread.messages} />

      {/* Input */}
      <MessageInput onSend={onSend} />
    </motion.div>
  );
}
