import type { AiModelId } from "./ai-model";

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  status: "sending" | "sent" | "failed";
  /** Set on bot messages to record which model generated the response. */
  modelId?: AiModelId;
}

export interface ChatThread {
  id: string;
  title: string;
  type: "ai" | "p2p" | "group";
  participantName?: string;
  peerId?: string;
  avatarUrl?: string | null;
  description?: string;
  memberIds?: string[];
  unreadCount?: number;
  messages: Message[];
  lastUpdated: Date;
  /** True when there are older messages in the DB not yet loaded. */
  hasMoreMessages?: boolean;
  /** ISO 8601 timestamp of the oldest currently loaded message — cursor for "load more". */
  oldestMessageTimestamp?: string;
}

export const CURRENT_USER_ID = "me";
export const BOT_SENDER_ID = "bot";
