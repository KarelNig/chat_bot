"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import type { Message } from "@/types/chat";
import { MessageBubble } from "./message-bubble";
import { formatDate } from "@/lib/utils";

interface MessagesAreaProps {
  messages: Message[];
}

interface MessageGroup {
  label: string;
  items: Message[];
}

export function MessagesArea({ messages }: MessagesAreaProps): React.JSX.Element {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const groups: MessageGroup[] = [];
  for (const msg of messages) {
    const label = formatDate(msg.timestamp);
    const lastGroup = groups.at(-1);
    if (lastGroup?.label === label) {
      lastGroup.items.push(msg);
    } else {
      groups.push({ label, items: [msg] });
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">
      {messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500 text-sm">No messages yet. Say hello!</p>
        </div>
      )}
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-2">
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-xs text-zinc-500 font-medium px-2">{group.label}</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {group.items.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
