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
  type: "ai" | "p2p";
  participantName?: string;
  peerId?: string; // other participant UUID in P2P threads
  messages: Message[];
  lastUpdated: Date;
}

export const CURRENT_USER_ID = "me";
export const BOT_SENDER_ID = "bot";
