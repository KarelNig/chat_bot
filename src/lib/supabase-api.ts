import { supabase } from "@/lib/supabase";
import type { ChatThread, Message } from "@/types/chat";
import { BOT_SENDER_ID } from "@/types/chat";
import type { Session } from "@/types/auth";

function toStatus(raw: string): Message["status"] {
  if (raw === "sending" || raw === "sent" || raw === "failed") return raw;
  return "sent";
}

// ── Profile helpers ───────────────────────────────────────────────────────────

export async function fetchProfileByUsername(username: string): Promise<Session | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username")
    .ilike("username", username)
    .maybeSingle();
  if (error || !data) return null;
  return { id: data.id, username: data.username };
}

export async function createProfile(id: string, username: string): Promise<Session | null> {
  if (!supabase) return null;
  const { error } = await supabase.from("profiles").insert({ id, username });
  if (error) {
    console.error("[supabase] createProfile:", error.message);
    return null;
  }
  return { id, username };
}

export async function searchProfiles(query: string, excludeId: string): Promise<Session[]> {
  if (!supabase || !query.trim()) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username")
    .ilike("username", `%${query}%`)
    .neq("id", excludeId)
    .limit(8);
  if (error || !data) return [];
  return data.map((p) => ({ id: p.id, username: p.username }));
}

// ── Thread helpers ────────────────────────────────────────────────────────────

export async function fetchAllThreads(userId: string): Promise<ChatThread[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("threads")
    .select("*")
    .or(`user_id.eq.${userId},receiver_id.eq.${userId}`)
    .order("created_at", { ascending: false });
  if (error || !data) return [];

  // Collect peer IDs so we can look up usernames in one query
  const peerIds: string[] = [];
  for (const row of data) {
    if (row.type === "p2p") {
      const pid = row.user_id === userId ? row.receiver_id : row.user_id;
      if (pid && !peerIds.includes(pid)) peerIds.push(pid);
    }
  }

  const peerMap: Record<string, string> = {};
  if (peerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", peerIds);
    if (profiles) {
      for (const p of profiles) {
        peerMap[p.id] = p.username;
      }
    }
  }

  return data.map((row) => {
    const isP2P = row.type === "p2p";
    const peerId = isP2P
      ? ((row.user_id === userId ? row.receiver_id : row.user_id) ?? undefined)
      : undefined;
    const peerName = peerId ? peerMap[peerId] : undefined;
    return {
      id: row.id,
      title: peerName ?? row.title,
      type: isP2P ? "p2p" : "ai",
      participantName: peerName,
      peerId,
      messages: [],
      lastUpdated: new Date(row.created_at),
    };
  });
}

export async function findExistingP2PThread(
  userId: string,
  peerId: string,
): Promise<string | null> {
  if (!supabase) return null;
  // Check thread started by current user
  const { data: a } = await supabase
    .from("threads")
    .select("id")
    .eq("type", "p2p")
    .eq("user_id", userId)
    .eq("receiver_id", peerId)
    .maybeSingle();
  if (a) return a.id;
  // Check thread started by peer
  const { data: b } = await supabase
    .from("threads")
    .select("id")
    .eq("type", "p2p")
    .eq("user_id", peerId)
    .eq("receiver_id", userId)
    .maybeSingle();
  return b?.id ?? null;
}

export async function insertThread(
  id: string,
  userId: string,
  title: string,
  type = "ai",
  receiverId?: string,
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("threads").insert({
    id,
    title,
    user_id: userId,
    type,
    ...(receiverId ? { receiver_id: receiverId } : {}),
  });
  if (error) {
    console.error("[supabase] insertThread:", error.message);
    return false;
  }
  return true;
}

export async function createP2PThread(
  id: string,
  userId: string,
  receiverId: string,
  title: string,
): Promise<boolean> {
  return insertThread(id, userId, title, "p2p", receiverId);
}

// ── Message helpers ───────────────────────────────────────────────────────────

export async function fetchMessages(threadId: string): Promise<Message[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    senderId: row.sender_id,
    text: row.text,
    timestamp: new Date(row.created_at),
    status: toStatus(row.status),
  }));
}

export async function insertMessage(
  id: string,
  threadId: string,
  senderId: string,
  text: string,
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("messages")
    .insert({ id, thread_id: threadId, sender_id: senderId, text, status: "sent" });
  if (error) {
    console.error("[supabase] insertMessage:", error.message);
    return false;
  }
  return true;
}

export async function insertBotMessage(
  id: string,
  threadId: string,
  text: string,
): Promise<boolean> {
  return insertMessage(id, threadId, BOT_SENDER_ID, text);
}
