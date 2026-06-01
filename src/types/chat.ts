export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  status: "sending" | "sent" | "failed";
}

export interface ChatThread {
  id: string;
  title: string;
  type: "ai" | "user";
  participantName?: string;
  messages: Message[];
  lastUpdated: Date;
}

export const CURRENT_USER_ID = "me";
