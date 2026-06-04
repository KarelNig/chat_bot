import { supabase } from "@/lib/supabase";
import type { ChatThread, Message } from "@/types/chat";
import { BOT_SENDER_ID } from "@/types/chat";
import type { Session } from "@/types/auth";
import type { UserProfile } from "@/types/profile";
import { AI_MODEL_IDS } from "@/types/ai-model";
import type { AiModelId } from "@/types/ai-model";
import { loadPersona } from "@/lib/persona-cache";

function toStatus(raw: string): Message["status"] {
  if (raw === "sending" || raw === "sent" || raw === "failed") return raw;
  return "sent";
}

function toModelId(raw: string | null | undefined): AiModelId | undefined {
  if (!raw) return undefined;
  return (AI_MODEL_IDS as readonly string[]).includes(raw) ? (raw as AiModelId) : undefined;
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

export async function fetchProfileByUsernameAndPassword(
  username: string,
  password: string,
): Promise<Session | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .ilike("username", username)
    .eq("password", password)
    .maybeSingle();
  if (error || !data) return null;
  return { id: data.id, username: data.username, avatarUrl: data.avatar_url };
}

export async function createProfile(
  id: string,
  username: string,
  password: string,
): Promise<Session | null> {
  if (!supabase) return null;
  const { error } = await supabase.from("profiles").insert({ id, username, password });
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
    .select("id, username, avatar_url")
    .ilike("username", `%${query}%`)
    .neq("id", excludeId)
    .limit(8);
  if (error || !data) return [];
  return data.map((p) => ({ id: p.id, username: p.username, avatarUrl: p.avatar_url }));
}

export async function fetchFullProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, phone, bio")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    username: data.username,
    avatarUrl: data.avatar_url,
    phone: data.phone,
    bio: data.bio,
  };
}

export async function updateProfile(
  userId: string,
  updates: { avatarUrl?: string | null; phone?: string | null; bio?: string | null },
): Promise<boolean> {
  if (!supabase) return false;
  const patch: { avatar_url?: string | null; phone?: string | null; bio?: string | null } = {};
  if (updates.avatarUrl !== undefined) patch.avatar_url = updates.avatarUrl;
  if (updates.phone !== undefined) patch.phone = updates.phone;
  if (updates.bio !== undefined) patch.bio = updates.bio;
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) {
    console.error("[supabase] updateProfile:", error.message);
    return false;
  }
  return true;
}

// ── Thread helpers ────────────────────────────────────────────────────────────

export async function fetchAllThreads(userId: string): Promise<ChatThread[]> {
  if (!supabase) return [];
  const db = supabase;

  // Fetch group thread IDs the user belongs to via thread_members
  const { data: memberships } = await supabase
    .from("thread_members")
    .select("thread_id")
    .eq("user_id", userId);
  const groupThreadIds = (memberships ?? []).map((m) => m.thread_id);

  // Fetch AI + P2P threads (user is creator or receiver)
  const { data: directData, error: directError } = await supabase
    .from("threads")
    .select("*")
    .or(`user_id.eq.${userId},receiver_id.eq.${userId}`)
    .in("type", ["ai", "p2p"])
    .order("created_at", { ascending: false });
  if (directError) console.error("[supabase] fetchAllThreads:", directError.message);

  // Fetch group threads via membership
  let groupRows: NonNullable<typeof directData> = [];
  if (groupThreadIds.length > 0) {
    const { data, error } = await supabase
      .from("threads")
      .select("*")
      .in("id", groupThreadIds)
      .eq("type", "group")
      .order("created_at", { ascending: false });
    if (error) console.error("[supabase] fetchAllThreads groups:", error.message);
    groupRows = data ?? [];
  }

  const allRows = [...(directData ?? []), ...groupRows];
  const threadIds = allRows.map((r) => r.id);

  // Fetch the latest message for each thread in parallel so the sidebar
  // shows last-message previews immediately without a separate lazy load.
  interface LastMsgRow {
    id: string;
    thread_id: string;
    sender_id: string;
    text: string;
    status: string;
    created_at: string;
  }
  const lastMsgMap: Record<string, LastMsgRow> = {};
  if (threadIds.length > 0) {
    const lastMsgResults = await Promise.all(
      threadIds.map((tid) =>
        db
          .from("messages")
          .select("id, thread_id, sender_id, text, status, created_at")
          .eq("thread_id", tid)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ),
    );
    for (const { data } of lastMsgResults) {
      if (data) lastMsgMap[data.thread_id] = data;
    }
  }

  // Batch-resolve peer usernames for P2P threads
  const peerIds: string[] = [];
  for (const row of allRows) {
    if (row.type === "p2p") {
      const pid = row.user_id === userId ? row.receiver_id : row.user_id;
      if (pid && !peerIds.includes(pid)) peerIds.push(pid);
    }
  }

  const peerMap: Record<string, { username: string; avatarUrl: string | null }> = {};
  if (peerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", peerIds);
    if (profiles) {
      for (const p of profiles) {
        peerMap[p.id] = { username: p.username, avatarUrl: p.avatar_url };
      }
    }
  }

  return allRows.map((row): ChatThread => {
    const isP2P = row.type === "p2p";
    const isGroup = row.type === "group";
    const peerId = isP2P
      ? ((row.user_id === userId ? row.receiver_id : row.user_id) ?? undefined)
      : undefined;
    const peer = peerId ? peerMap[peerId] : undefined;
    const lastMsgRow = lastMsgMap[row.id] ?? null;
    const lastMsg: Message | null = lastMsgRow
      ? {
          id: lastMsgRow.id,
          senderId: lastMsgRow.sender_id,
          text: lastMsgRow.text,
          timestamp: new Date(lastMsgRow.created_at),
          status: toStatus(lastMsgRow.status),
          modelId: toModelId(loadPersona(lastMsgRow.id)),
        }
      : null;
    return {
      id: row.id,
      title: peer?.username ?? row.title,
      type: isGroup ? "group" : isP2P ? "p2p" : "ai",
      participantName: peer?.username,
      peerId,
      avatarUrl: isP2P ? (peer?.avatarUrl ?? null) : (row.avatar_url ?? null),
      description: row.description ?? undefined,
      messages: lastMsg ? [lastMsg] : [],
      lastUpdated: lastMsg ? lastMsg.timestamp : new Date(row.created_at),
    };
  });
}

export async function findExistingP2PThread(
  userId: string,
  peerId: string,
): Promise<string | null> {
  if (!supabase) return null;
  const { data: a } = await supabase
    .from("threads")
    .select("id")
    .eq("type", "p2p")
    .eq("user_id", userId)
    .eq("receiver_id", peerId)
    .maybeSingle();
  if (a) return a.id;
  const { data: b } = await supabase
    .from("threads")
    .select("id")
    .eq("type", "p2p")
    .eq("user_id", peerId)
    .eq("receiver_id", userId)
    .maybeSingle();
  return b?.id ?? null;
}

export async function updateThread(
  threadId: string,
  updates: { avatarUrl?: string | null; description?: string | null },
): Promise<boolean> {
  if (!supabase) return false;
  const patch: { avatar_url?: string | null; description?: string | null } = {};
  if (updates.avatarUrl !== undefined) patch.avatar_url = updates.avatarUrl;
  if (updates.description !== undefined) patch.description = updates.description;
  const { error } = await supabase.from("threads").update(patch).eq("id", threadId);
  if (error) {
    console.error("[supabase] updateThread:", error.message);
    return false;
  }
  return true;
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

// ── Thread members ─────────────────────────────────────────────────────────────

export async function addThreadMembers(threadId: string, userIds: string[]): Promise<boolean> {
  if (!supabase || userIds.length === 0) return true;
  const rows = userIds.map((uid) => ({ thread_id: threadId, user_id: uid }));
  const { error } = await supabase.from("thread_members").insert(rows);
  if (error) {
    console.error("[supabase] addThreadMembers:", error.message);
    return false;
  }
  return true;
}

export async function fetchGroupMembers(threadId: string): Promise<Session[]> {
  if (!supabase) return [];
  const { data: memberships } = await supabase
    .from("thread_members")
    .select("user_id")
    .eq("thread_id", threadId);
  if (!memberships || memberships.length === 0) return [];
  const userIds = memberships.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", userIds);
  if (!profiles) return [];
  return profiles.map((p) => ({ id: p.id, username: p.username, avatarUrl: p.avatar_url }));
}

export async function fetchCommonGroups(
  userId: string,
  peerId: string,
): Promise<{ id: string; title: string }[]> {
  if (!supabase) return [];
  const [{ data: mine }, { data: theirs }] = await Promise.all([
    supabase.from("thread_members").select("thread_id").eq("user_id", userId),
    supabase.from("thread_members").select("thread_id").eq("user_id", peerId),
  ]);
  if (!mine || !theirs) return [];
  const myIds = new Set(mine.map((m) => m.thread_id));
  const commonIds = theirs.map((m) => m.thread_id).filter((id) => myIds.has(id));
  if (commonIds.length === 0) return [];
  const { data: threads } = await supabase
    .from("threads")
    .select("id, title")
    .in("id", commonIds)
    .eq("type", "group");
  return (threads ?? []).map((t) => ({ id: t.id, title: t.title }));
}

export async function createGroupThread(
  id: string,
  userId: string,
  title: string,
  memberIds: string[],
): Promise<boolean> {
  const ok = await insertThread(id, userId, title, "group");
  if (!ok) return false;
  return addThreadMembers(id, [...new Set([userId, ...memberIds])]);
}

// ── Message helpers ───────────────────────────────────────────────────────────

export async function fetchMessages(threadId: string): Promise<Message[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("messages")
      .select("id, thread_id, sender_id, text, status, created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[supabase] fetchMessages error:", error);
      return [];
    }
    if (!data) return [];
    return data.map((row) => ({
      id: row.id,
      senderId: row.sender_id,
      text: row.text,
      timestamp: new Date(row.created_at),
      status: toStatus(row.status),
      modelId: toModelId(loadPersona(row.id)),
    }));
  } catch (err) {
    console.error("[supabase] fetchMessages threw:", err);
    return [];
  }
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

export async function updateThreadTitle(threadId: string, title: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("threads").update({ title }).eq("id", threadId);
  if (error) {
    console.error("[supabase] updateThreadTitle:", error.message);
    return false;
  }
  return true;
}

export async function deleteThread(threadId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("threads").delete().eq("id", threadId);
  if (error) {
    console.error("[supabase] deleteThread:", error.message);
    return false;
  }
  return true;
}
