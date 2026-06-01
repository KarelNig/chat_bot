"use client";

import { useState, useCallback, useEffect } from "react";
import type { ChatThread, Message } from "@/types/chat";
import { CURRENT_USER_ID } from "@/types/chat";
import { MOCK_THREADS } from "@/lib/mock-data";
import { generateId } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchThreads, fetchMessages, insertThread, insertMessage } from "@/lib/supabase-api";

interface UseChatReturn {
  threads: ChatThread[];
  activeThreadId: string | null;
  activeThread: ChatThread | null;
  draftThread: ChatThread | null;
  searchQuery: string;
  filteredThreads: ChatThread[];
  isLoading: boolean;
  selectThread: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  startNewDraft: () => void;
  sendMessage: (text: string) => void;
}

function makeId(): string {
  return isSupabaseConfigured ? crypto.randomUUID() : generateId();
}

export function useChat(): UseChatReturn {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [draftThread, setDraftThread] = useState<ChatThread | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Initial thread load — Supabase when configured, mock data as fallback
  useEffect(() => {
    async function load(): Promise<void> {
      if (!isSupabaseConfigured) {
        setThreads(MOCK_THREADS);
        setIsLoading(false);
        return;
      }
      try {
        const data = await fetchThreads();
        setThreads(data);
      } catch (err) {
        console.error("[use-chat] load threads failed:", err);
        setThreads(MOCK_THREADS);
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  const filteredThreads = threads.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeThread: ChatThread | null =
    draftThread !== null && activeThreadId === draftThread.id
      ? draftThread
      : (threads.find((t) => t.id === activeThreadId) ?? null);

  // Select a thread — lazy-loads its messages from Supabase, discards draft
  const selectThread = useCallback(
    (id: string | null): void => {
      if (draftThread !== null && id !== draftThread.id) {
        setDraftThread(null);
      }
      setActiveThreadId(id);
      if (!id || !isSupabaseConfigured) return;

      const targetId = id;
      async function loadMessages(): Promise<void> {
        try {
          const messages = await fetchMessages(targetId);
          setThreads((prev) => prev.map((t) => (t.id === targetId ? { ...t, messages } : t)));
        } catch (err) {
          console.error("[use-chat] load messages failed:", err);
        }
      }
      void loadMessages();
    },
    [draftThread],
  );

  // Open a blank draft workspace — not added to the sidebar until first send
  const startNewDraft = useCallback((): void => {
    const draft: ChatThread = {
      id: generateId(),
      title: "New Chat",
      type: "user",
      messages: [],
      lastUpdated: new Date(),
    };
    setDraftThread(draft);
    setActiveThreadId(draft.id);
  }, []);

  const sendMessage = useCallback(
    (text: string): void => {
      if (!activeThreadId || !text.trim()) return;
      const trimmed = text.trim();

      // ── Draft promotion: first message creates the persisted thread ───────
      if (draftThread !== null && activeThreadId === draftThread.id) {
        const frozenDraft = draftThread;
        const newThreadId = makeId();
        const msgId = makeId();
        const count = threads.length + 1;
        const title = `Chat ${count.toString()}`;

        const firstMsg: Message = {
          id: msgId,
          senderId: CURRENT_USER_ID,
          text: trimmed,
          timestamp: new Date(),
          status: isSupabaseConfigured ? "sending" : "sent",
        };

        setThreads((prev) => [
          { ...frozenDraft, id: newThreadId, title, messages: [firstMsg], lastUpdated: new Date() },
          ...prev,
        ]);
        setDraftThread(null);
        setActiveThreadId(newThreadId);

        if (!isSupabaseConfigured) return;

        async function persistDraft(): Promise<void> {
          const threadOk = await insertThread(newThreadId, title);
          const msgOk = threadOk ? await insertMessage(msgId, newThreadId, trimmed) : false;
          setThreads((prev) =>
            prev.map((t) =>
              t.id === newThreadId
                ? {
                    ...t,
                    messages: t.messages.map((m) =>
                      m.id === msgId ? { ...m, status: msgOk ? "sent" : "failed" } : m,
                    ),
                  }
                : t,
            ),
          );
        }
        void persistDraft();
        return;
      }

      // ── Normal send: append to an existing persisted thread ───────────────
      const msgId = makeId();
      const newMsg: Message = {
        id: msgId,
        senderId: CURRENT_USER_ID,
        text: trimmed,
        timestamp: new Date(),
        status: isSupabaseConfigured ? "sending" : "sent",
      };

      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? { ...t, messages: [...t.messages, newMsg], lastUpdated: new Date() }
            : t,
        ),
      );

      if (!isSupabaseConfigured) return;

      const threadIdSnapshot = activeThreadId;
      async function persistMessage(): Promise<void> {
        const ok = await insertMessage(msgId, threadIdSnapshot, trimmed);
        setThreads((prev) =>
          prev.map((t) =>
            t.id === threadIdSnapshot
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === msgId ? { ...m, status: ok ? "sent" : "failed" } : m,
                  ),
                }
              : t,
          ),
        );
      }
      void persistMessage();
    },
    [activeThreadId, draftThread, threads],
  );

  return {
    threads,
    activeThreadId,
    activeThread,
    draftThread,
    searchQuery,
    filteredThreads,
    isLoading,
    selectThread,
    setSearchQuery,
    startNewDraft,
    sendMessage,
  };
}
