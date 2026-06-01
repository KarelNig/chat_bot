"use client";

import { useState, useCallback, useEffect } from "react";
import type { ChatThread, Message } from "@/types/chat";
import { CURRENT_USER_ID, BOT_SENDER_ID } from "@/types/chat";
import { MOCK_THREADS } from "@/lib/mock-data";
import { generateId } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  fetchThreads,
  fetchMessages,
  insertThread,
  insertMessage,
  insertBotMessage,
} from "@/lib/supabase-api";
import { getRandomResponse, getRandomDelay, sleep } from "@/lib/ai-bot";

interface UseChatReturn {
  threads: ChatThread[];
  activeThreadId: string | null;
  activeThread: ChatThread | null;
  draftThread: ChatThread | null;
  searchQuery: string;
  filteredThreads: ChatThread[];
  isLoading: boolean;
  isBotTyping: boolean;
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
  const [isBotTyping, setIsBotTyping] = useState(false);

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

  const selectThread = useCallback(
    (id: string | null): void => {
      if (draftThread !== null && id !== draftThread.id) {
        setDraftThread(null);
      }
      setIsBotTyping(false);
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

  const startNewDraft = useCallback((): void => {
    const draft: ChatThread = {
      id: generateId(),
      title: "New Chat",
      type: "user",
      messages: [],
      lastUpdated: new Date(),
    };
    setIsBotTyping(false);
    setDraftThread(draft);
    setActiveThreadId(draft.id);
  }, []);

  const sendMessage = useCallback(
    (text: string): void => {
      if (!activeThreadId || !text.trim()) return;
      const trimmed = text.trim();

      // Schedules the bot reply for a given persisted thread.
      // Runs independently of DB persistence so the UI is never blocked.
      async function scheduleBot(threadId: string): Promise<void> {
        setIsBotTyping(true);
        await sleep(getRandomDelay());

        const botMsg: Message = {
          id: makeId(),
          senderId: BOT_SENDER_ID,
          text: getRandomResponse(),
          timestamp: new Date(),
          status: "sent",
        };

        setThreads((prev) =>
          prev.map((t) =>
            t.id === threadId
              ? { ...t, messages: [...t.messages, botMsg], lastUpdated: new Date() }
              : t,
          ),
        );
        setIsBotTyping(false);

        if (isSupabaseConfigured) {
          await insertBotMessage(botMsg.id, threadId, botMsg.text);
        }
      }

      // ── Draft promotion ───────────────────────────────────────────────────
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

        async function persistDraft(): Promise<void> {
          if (!isSupabaseConfigured) return;
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
        void scheduleBot(newThreadId);
        return;
      }

      // ── Normal send ───────────────────────────────────────────────────────
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

      const threadIdSnapshot = activeThreadId;

      async function persistMessage(): Promise<void> {
        if (!isSupabaseConfigured) return;
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
      void scheduleBot(threadIdSnapshot);
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
    isBotTyping,
    selectThread,
    setSearchQuery,
    startNewDraft,
    sendMessage,
  };
}
