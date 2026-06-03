import type { ChatThread, Message } from "@/types/chat";
import { CURRENT_USER_ID } from "@/types/chat";

function msg(
  id: string,
  senderId: string,
  text: string,
  minutesAgo: number,
  status: Message["status"] = "sent",
): Message {
  const ts = new Date();
  ts.setMinutes(ts.getMinutes() - minutesAgo);
  return { id, senderId, text, timestamp: ts, status };
}

export const MOCK_THREADS: ChatThread[] = [
  {
    id: "thread-1",
    title: "Aslan",
    type: "ai",
    unreadCount: 0,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 5),
    messages: [
      msg("m1-1", "bot", "Hey! How can I help you today?", 30),
      msg("m1-2", CURRENT_USER_ID, "Pretty good, thanks for asking!", 28),
      msg("m1-3", "bot", "Awesome! Let me know if you need anything.", 20),
      msg("m1-4", CURRENT_USER_ID, "Sure, sounds great!", 5),
    ],
  },
  {
    id: "thread-2",
    title: "Moana",
    type: "ai",
    unreadCount: 2,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 12),
    messages: [
      msg("m2-1", CURRENT_USER_ID, "Can you help me with this project?", 60),
      msg("m2-2", "bot", "Of course! I'm here to help.", 58),
      msg("m2-3", "bot", "Let me know when you are ready 🚀", 12),
    ],
  },
  {
    id: "thread-3",
    title: "AI Assistant",
    type: "ai",
    unreadCount: 0,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 45),
    messages: [
      msg("m3-1", "bot", "Hello! How can I assist you today?", 90),
      msg("m3-2", CURRENT_USER_ID, "Tell me about framer-motion animations.", 88),
      msg(
        "m3-3",
        "bot",
        "Framer Motion is a production-ready animation library for React with simple declarative APIs.",
        45,
      ),
    ],
  },
];
