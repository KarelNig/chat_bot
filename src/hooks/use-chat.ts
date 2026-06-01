"use client";

import { useState, useCallback } from "react";
import type { ChatThread, Message } from "@/types/chat";
import { CURRENT_USER_ID } from "@/types/chat";
import { MOCK_THREADS } from "@/lib/mock-data";
import { generateId } from "@/lib/utils";

interface UseChatReturn {
  threads: ChatThread[];
  activeThreadId: string | null;
  activeThread: ChatThread | null;
  searchQuery: string;
  filteredThreads: ChatThread[];
  setActiveThreadId: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  createNewThread: () => void;
  sendMessage: (text: string) => void;
}

export function useChat(): UseChatReturn {
  const [threads, setThreads] = useState<ChatThread[]>(MOCK_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredThreads = threads.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeThread = threads.find((t) => t.id === activeThreadId) ?? null;

  const createNewThread = useCallback(() => {
    const id = generateId();
    const count = threads.length + 1;
    const newThread: ChatThread = {
      id,
      title: `Chat ${count.toString()}`,
      type: "user",
      messages: [],
      lastUpdated: new Date(),
    };
    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(id);
  }, [threads.length]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!activeThreadId || !text.trim()) return;
      const newMsg: Message = {
        id: generateId(),
        senderId: CURRENT_USER_ID,
        text: text.trim(),
        timestamp: new Date(),
        status: "sent",
      };
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? { ...t, messages: [...t.messages, newMsg], lastUpdated: new Date() }
            : t,
        ),
      );
    },
    [activeThreadId],
  );

  return {
    threads,
    activeThreadId,
    activeThread,
    searchQuery,
    filteredThreads,
    setActiveThreadId,
    setSearchQuery,
    createNewThread,
    sendMessage,
  };
}
