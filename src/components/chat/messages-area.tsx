"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import type { Message } from "@/types/chat";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import { formatDate } from "@/lib/utils";

interface MessagesAreaProps {
  messages: Message[];
  isBotTyping: boolean;
  currentUserId: string;
  hasMoreMessages?: boolean;
  onLoadMore?: () => void;
}

interface MessageGroup {
  label: string;
  items: Message[];
}

export function MessagesArea({
  messages,
  isBotTyping,
  currentUserId,
  hasMoreMessages,
  onLoadMore,
}: MessagesAreaProps): React.JSX.Element {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isBotTyping]);

  const groups: MessageGroup[] = [];
  for (const msg of messages) {
    const label = formatDate(msg.timestamp);
    const last = groups.at(-1);
    if (last?.label === label) {
      last.items.push(msg);
    } else {
      groups.push({ label, items: [msg] });
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-1 bg-gray-50">
      {/* Load more button — shown at the top when older messages exist in the DB */}
      {hasMoreMessages && onLoadMore && (
        <div className="flex justify-center pt-1 pb-3">
          <button
            onClick={onLoadMore}
            className="text-xs text-violet-600 hover:text-violet-700 font-medium px-4 py-1.5 rounded-full bg-violet-50 hover:bg-violet-100 transition-colors"
          >
            Load earlier messages
          </button>
        </div>
      )}

      {messages.length === 0 && !isBotTyping && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-sm">No messages yet. Say hello!</p>
        </div>
      )}
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-2">
          {/* Centered date separator */}
          <div className="flex items-center justify-center my-3">
            <span className="text-xs text-gray-400 font-medium bg-gray-100 px-3 py-1 rounded-full">
              {group.label}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {group.items.map((msg) => (
                <MessageBubble key={msg.id} message={msg} currentUserId={currentUserId} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
      <AnimatePresence>{isBotTyping && <TypingIndicator key="typing" />}</AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}
