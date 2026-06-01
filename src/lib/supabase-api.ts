import { supabase } from "@/lib/supabase";
import type { ChatThread, Message } from "@/types/chat";
import { CURRENT_USER_ID } from "@/types/chat";

function toMessageStatus(raw: string): Message["status"] {
  if (raw === "sending" || raw === "sent" || raw === "failed") return raw;
  return "sent";
}

export async function fetchThreads(): Promise<ChatThread[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("threads")
    .select("*")
    .eq("user_id", CURRENT_USER_ID)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[supabase] fetchThreads:", error.message);
    return [];
  }
  if (!data) return [];
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    type: "user" as const,
    messages: [],
    lastUpdated: new Date(row.created_at),
  }));
}

export async function fetchMessages(threadId: string): Promise<Message[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[supabase] fetchMessages:", error.message);
    return [];
  }
  if (!data) return [];
  return data.map((row) => ({
    id: row.id,
    senderId: row.sender_id,
    text: row.text,
    timestamp: new Date(row.created_at),
    status: toMessageStatus(row.status),
  }));
}

export async function insertThread(id: string, title: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("threads").insert({ id, title, user_id: CURRENT_USER_ID });
  if (error) {
    console.error("[supabase] insertThread:", error.message);
    return false;
  }
  return true;
}

export async function insertMessage(id: string, threadId: string, text: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("messages")
    .insert({ id, thread_id: threadId, sender_id: CURRENT_USER_ID, text, status: "sent" });
  if (error) {
    console.error("[supabase] insertMessage:", error.message);
    return false;
  }
  return true;
}
