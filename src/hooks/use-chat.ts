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
  draftThread: ChatThread | null;
  searchQuery: string;
  filteredThreads: ChatThread[];
  selectThread: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  startNewDraft: () => void;
  sendMessage: (text: string) => void;
}

export function useChat(): UseChatReturn {
  const [threads, setThreads] = useState<ChatThread[]>(MOCK_THREADS);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [draftThread, setDraftThread] = useState<ChatThread | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredThreads = threads.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Resolve active thread: draft takes priority when its id matches
  const activeThread: ChatThread | null =
    draftThread !== null && activeThreadId === draftThread.id
      ? draftThread
      : (threads.find((t) => t.id === activeThreadId) ?? null);

  // Selecting a thread discards any in-flight draft
  const selectThread = useCallback(
    (id: string | null) => {
      if (draftThread !== null && id !== draftThread.id) {
        setDraftThread(null);
      }
      setActiveThreadId(id);
    },
    [draftThread],
  );

  // Creates a blank workspace that is NOT added to the sidebar list
  const startNewDraft = useCallback(() => {
    const id = generateId();
    const draft: ChatThread = {
      id,
      title: "New Chat",
      type: "user",
      messages: [],
      lastUpdated: new Date(),
    };
    setDraftThread(draft);
    setActiveThreadId(id);
  }, []);

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

      // First message in a draft — promote it into the persisted list
      if (draftThread !== null && activeThreadId === draftThread.id) {
        setThreads((prev) => {
          const count = prev.length + 1;
          const promoted: ChatThread = {
            ...draftThread,
            title: `Chat ${count.toString()}`,
            messages: [newMsg],
            lastUpdated: new Date(),
          };
          return [promoted, ...prev];
        });
        setDraftThread(null);
        // activeThreadId stays the same — it now points to the promoted thread
        return;
      }

      // Normal append to an existing persisted thread
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? { ...t, messages: [...t.messages, newMsg], lastUpdated: new Date() }
            : t,
        ),
      );
    },
    [activeThreadId, draftThread],
  );

  return {
    threads,
    activeThreadId,
    activeThread,
    draftThread,
    searchQuery,
    filteredThreads,
    selectThread,
    setSearchQuery,
    startNewDraft,
    sendMessage,
  };
}
