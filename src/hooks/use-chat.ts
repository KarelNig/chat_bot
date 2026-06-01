"use client";

import { useState, useCallback, useEffect } from "react";
import type { ChatThread, Message } from "@/types/chat";
import { BOT_SENDER_ID } from "@/types/chat";
import { MOCK_THREADS } from "@/lib/mock-data";
import { generateId } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  fetchAllThreads,
  fetchMessages,
  insertThread,
  insertMessage,
  insertBotMessage,
  createP2PThread,
  findExistingP2PThread,
} from "@/lib/supabase-api";
import { getRandomResponse, getRandomDelay, sleep } from "@/lib/ai-bot";
import type { Session } from "@/types/auth";

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
  startP2PThread: (target: Session) => void;
  sendMessage: (text: string) => void;
}

function makeId(): string {
  return isSupabaseConfigured ? crypto.randomUUID() : generateId();
}

export function useChat(userId: string): UseChatReturn {
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
        const data = await fetchAllThreads(userId);
        setThreads(data);
      } catch (err) {
        console.error("[use-chat] load failed:", err);
        setThreads(MOCK_THREADS);
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [userId]);

  const filteredThreads = threads.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeThread: ChatThread | null =
    draftThread !== null && activeThreadId === draftThread.id
      ? draftThread
      : (threads.find((t) => t.id === activeThreadId) ?? null);

  const selectThread = useCallback(
    (id: string | null): void => {
      if (draftThread !== null && id !== draftThread.id) setDraftThread(null);
      setIsBotTyping(false);
      setActiveThreadId(id);
      if (!id || !isSupabaseConfigured) return;
      const tid = id;
      async function load(): Promise<void> {
        try {
          const messages = await fetchMessages(tid);
          setThreads((prev) => prev.map((t) => (t.id === tid ? { ...t, messages } : t)));
        } catch (err) {
          console.error("[use-chat] load messages failed:", err);
        }
      }
      void load();
    },
    [draftThread],
  );

  const startNewDraft = useCallback((): void => {
    const draft: ChatThread = {
      id: generateId(),
      title: "New Chat",
      type: "ai",
      messages: [],
      lastUpdated: new Date(),
    };
    setIsBotTyping(false);
    setDraftThread(draft);
    setActiveThreadId(draft.id);
  }, []);

  const startP2PThread = useCallback(
    (target: Session): void => {
      // Reuse existing local thread if found
      const existing = threads.find((t) => t.type === "p2p" && t.peerId === target.id);
      if (existing) {
        selectThread(existing.id);
        return;
      }
      const newId = makeId();
      const newThread: ChatThread = {
        id: newId,
        title: target.username,
        type: "p2p",
        participantName: target.username,
        peerId: target.id,
        messages: [],
        lastUpdated: new Date(),
      };
      setThreads((prev) => [newThread, ...prev]);
      setDraftThread(null);
      setIsBotTyping(false);
      setActiveThreadId(newId);

      if (!isSupabaseConfigured) return;

      async function persist(): Promise<void> {
        // Check DB for existing thread before creating
        const existingId = await findExistingP2PThread(userId, target.id);
        if (existingId) {
          // Update local entry to use the real DB id
          setThreads((prev) => prev.map((t) => (t.id === newId ? { ...t, id: existingId } : t)));
          setActiveThreadId(existingId);
          const messages = await fetchMessages(existingId);
          setThreads((prev) => prev.map((t) => (t.id === existingId ? { ...t, messages } : t)));
          return;
        }
        const ok = await createP2PThread(newId, userId, target.id, target.username);
        if (!ok) {
          setThreads((prev) => prev.filter((t) => t.id !== newId));
          setActiveThreadId(null);
        }
      }
      void persist();
    },
    [threads, userId, selectThread],
  );

  const sendMessage = useCallback(
    (text: string): void => {
      if (!activeThreadId || !text.trim()) return;
      const trimmed = text.trim();

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

      // ── Draft promotion ───────────────────────────────────────────────
      if (draftThread !== null && activeThreadId === draftThread.id) {
        const frozen = draftThread;
        const newThreadId = makeId();
        const msgId = makeId();
        const count = threads.length + 1;
        const title = `Chat ${count.toString()}`;
        const firstMsg: Message = {
          id: msgId,
          senderId: userId,
          text: trimmed,
          timestamp: new Date(),
          status: isSupabaseConfigured ? "sending" : "sent",
        };
        setThreads((prev) => [
          {
            ...frozen,
            id: newThreadId,
            title,
            type: "ai",
            messages: [firstMsg],
            lastUpdated: new Date(),
          },
          ...prev,
        ]);
        setDraftThread(null);
        setActiveThreadId(newThreadId);

        async function persistDraft(): Promise<void> {
          if (!isSupabaseConfigured) return;
          const ok1 = await insertThread(newThreadId, userId, title, "ai");
          const ok2 = ok1 ? await insertMessage(msgId, newThreadId, userId, trimmed) : false;
          setThreads((prev) =>
            prev.map((t) =>
              t.id === newThreadId
                ? {
                    ...t,
                    messages: t.messages.map((m) =>
                      m.id === msgId ? { ...m, status: ok2 ? "sent" : "failed" } : m,
                    ),
                  }
                : t,
            ),
          );
        }
        void persistDraft();
        void scheduleBot(newThreadId); // drafts are always AI threads
        return;
      }

      // ── Normal send ───────────────────────────────────────────────────
      const msgId = makeId();
      const newMsg: Message = {
        id: msgId,
        senderId: userId,
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

      const snapshot = activeThreadId;
      const currentThread = threads.find((t) => t.id === snapshot);
      const isP2P = currentThread?.type === "p2p";

      async function persistMsg(): Promise<void> {
        if (!isSupabaseConfigured) return;
        const ok = await insertMessage(msgId, snapshot, userId, trimmed);
        setThreads((prev) =>
          prev.map((t) =>
            t.id === snapshot
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
      void persistMsg();
      if (!isP2P) void scheduleBot(snapshot); // bot only in AI threads
    },
    [activeThreadId, draftThread, threads, userId],
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
    startP2PThread,
    sendMessage,
  };
}
