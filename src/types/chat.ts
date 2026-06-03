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
}

export const CURRENT_USER_ID = "me";
export const BOT_SENDER_ID = "bot";
