"use client";

import { useState, useCallback, useEffect } from "react";
import type { ChatThread, Message } from "@/types/chat";
import { BOT_SENDER_ID } from "@/types/chat";
import type { AiModelId } from "@/types/ai-model";
import { DEFAULT_MODEL_ID } from "@/types/ai-model";
import type { Session } from "@/types/auth";
import { MOCK_THREADS } from "@/lib/mock-data";
import { generateId } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  fetchAllThreads,
  fetchMessages,
  insertThread,
  insertMessage,
  insertBotMessage,
  findExistingP2PThread,
  createP2PThread,
  addThreadMembers,
  createGroupThread,
  updateThread as updateThreadApi,
  updateThreadTitle,
  deleteThread as deleteThreadApi,
} from "@/lib/supabase-api";
import { getModelResponse } from "@/lib/ai-bot";
import { savePersona } from "@/lib/persona-cache";

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
  startP2PChat: (peer: Session) => Promise<void>;
  createGroup: (title: string, memberIds: string[]) => Promise<void>;
  sendMessage: (text: string, modelId?: AiModelId) => void;
  updateThread: (
    threadId: string,
    updates: { avatarUrl?: string | null; description?: string | null },
  ) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
}

function makeId(): string {
  return isSupabaseConfigured ? crypto.randomUUID() : generateId();
}

// userId is null while auth is loading — guards below ensure we never hit
// Supabase with an invalid value before a real UUID is available.
export function useChat(userId: string | null): UseChatReturn {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [draftThread, setDraftThread] = useState<ChatThread | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBotTyping, setIsBotTyping] = useState(false);

  useEffect(() => {
    async function load(): Promise<void> {
      // No authenticated user yet — do not touch the database.
      if (!userId) {
        setThreads([]);
        setIsLoading(false);
        return;
      }
      if (!isSupabaseConfigured) {
        setThreads(MOCK_THREADS);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
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

  const startP2PChat = useCallback(
    async (peer: Session): Promise<void> => {
      if (!userId) return;
      const uid = userId; // capture narrowed string for use inside closures
      setDraftThread(null);
      setIsBotTyping(false);

      if (isSupabaseConfigured) {
        const existingId = await findExistingP2PThread(uid, peer.id);
        if (existingId) {
          setThreads((prev) => {
            if (prev.find((t) => t.id === existingId)) return prev;
            const thread: ChatThread = {
              id: existingId,
              title: peer.username,
              type: "p2p",
              peerId: peer.id,
              participantName: peer.username,
              avatarUrl: peer.avatarUrl ?? null,
              messages: [],
              lastUpdated: new Date(),
            };
            return [thread, ...prev];
          });
          setActiveThreadId(existingId);
          try {
            const msgs = await fetchMessages(existingId);
            setThreads((prev) =>
              prev.map((t) => (t.id === existingId ? { ...t, messages: msgs } : t)),
            );
          } catch (err) {
            console.error("[use-chat] startP2PChat messages:", err);
          }
          return;
        }
        const threadId = makeId();
        const ok = await createP2PThread(threadId, uid, peer.id, peer.username);
        if (ok) await addThreadMembers(threadId, [uid, peer.id]);
        const thread: ChatThread = {
          id: threadId,
          title: peer.username,
          type: "p2p",
          peerId: peer.id,
          participantName: peer.username,
          avatarUrl: peer.avatarUrl ?? null,
          messages: [],
          lastUpdated: new Date(),
        };
        setThreads((prev) => [thread, ...prev]);
        setActiveThreadId(threadId);
      } else {
        const threadId = generateId();
        const thread: ChatThread = {
          id: threadId,
          title: peer.username,
          type: "p2p",
          peerId: peer.id,
          participantName: peer.username,
          messages: [],
          lastUpdated: new Date(),
        };
        setThreads((prev) => [thread, ...prev]);
        setActiveThreadId(threadId);
      }
    },
    [userId],
  );

  const createGroup = useCallback(
    async (title: string, memberIds: string[]): Promise<void> => {
      if (!userId) return;
      const uid = userId; // capture narrowed string for use inside closures
      const threadId = makeId();
      const allMemberIds = [...new Set([uid, ...memberIds])];
      const thread: ChatThread = {
        id: threadId,
        title,
        type: "group",
        memberIds: allMemberIds,
        messages: [],
        lastUpdated: new Date(),
      };
      setThreads((prev) => [thread, ...prev]);
      setActiveThreadId(threadId);
      setDraftThread(null);
      if (isSupabaseConfigured) {
        await createGroupThread(threadId, uid, title, memberIds);
      }
    },
    [userId],
  );

  const updateThread = useCallback(
    async (
      threadId: string,
      updates: { avatarUrl?: string | null; description?: string | null },
    ): Promise<void> => {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                ...(updates.avatarUrl !== undefined ? { avatarUrl: updates.avatarUrl } : {}),
                ...(updates.description !== undefined
                  ? { description: updates.description ?? undefined }
                  : {}),
                lastUpdated: new Date(),
              }
            : t,
        ),
      );
      if (isSupabaseConfigured) {
        await updateThreadApi(threadId, updates);
      }
    },
    [],
  );

  const sendMessage = useCallback(
    (text: string, modelId: AiModelId = DEFAULT_MODEL_ID): void => {
      if (!activeThreadId || !text.trim() || !userId) return;
      const uid = userId; // capture narrowed string for use inside closures
      const trimmed = text.trim();

      // Only AI threads get a bot response
      const currentThread =
        draftThread !== null && activeThreadId === draftThread.id
          ? draftThread
          : threads.find((t) => t.id === activeThreadId);
      const isAiThread = !currentThread || currentThread.type === "ai";

      async function scheduleBot(threadId: string): Promise<void> {
        if (!isAiThread) return;
        setIsBotTyping(true);
        const botText = await getModelResponse(trimmed, modelId);
        const botMsg: Message = {
          id: makeId(),
          senderId: BOT_SENDER_ID,
          text: botText,
          modelId,
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
        savePersona(botMsg.id, modelId);
        if (isSupabaseConfigured) {
          await insertBotMessage(botMsg.id, threadId, botMsg.text);
        }
      }

      // ── Draft promotion (always AI type) ──────────────────────────────
      if (draftThread !== null && activeThreadId === draftThread.id) {
        const frozen = draftThread;
        const newThreadId = makeId();
        const msgId = makeId();
        const count = threads.length + 1;
        const title = `Chat ${count.toString()}`;
        const firstMsg: Message = {
          id: msgId,
          senderId: uid,
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
          const ok1 = await insertThread(newThreadId, uid, title, "ai");
          const ok2 = ok1 ? await insertMessage(msgId, newThreadId, uid, trimmed) : false;
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
        void scheduleBot(newThreadId);

        async function generateAndApplyTitle(threadId: string): Promise<void> {
          try {
            const res = await fetch("/api/generate-title", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: trimmed }),
            });
            if (!res.ok) return;
            const data = (await res.json()) as { title?: string };
            const newTitle = data.title?.trim();
            if (!newTitle) return;
            setThreads((prev) =>
              prev.map((t) => (t.id === threadId ? { ...t, title: newTitle } : t)),
            );
            if (isSupabaseConfigured) {
              await updateThreadTitle(threadId, newTitle);
            }
          } catch {
            // Title generation is non-critical — silently ignore failures
          }
        }
        void generateAndApplyTitle(newThreadId);
        return;
      }

      // ── Normal send ───────────────────────────────────────────────────
      const msgId = makeId();
      const newMsg: Message = {
        id: msgId,
        senderId: uid,
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

      async function persistMsg(): Promise<void> {
        if (!isSupabaseConfigured) return;
        const ok = await insertMessage(msgId, snapshot, uid, trimmed);
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
      void scheduleBot(snapshot);
    },
    [activeThreadId, draftThread, threads, userId],
  );

  const deleteThread = useCallback(async (threadId: string): Promise<void> => {
    setThreads((prev) => prev.filter((t) => t.id !== threadId));
    setActiveThreadId((prev) => (prev === threadId ? null : prev));
    setDraftThread((prev) => (prev?.id === threadId ? null : prev));
    setIsBotTyping(false);
    if (isSupabaseConfigured) {
      await deleteThreadApi(threadId);
    }
  }, []);

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
    startP2PChat,
    createGroup,
    sendMessage,
    updateThread,
    deleteThread,
  };
}
