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
    title: "Chat 1",
    type: "user",
    participantName: "Aslan",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 5),
    messages: [
      msg("m1-1", "aslan", "Hey, how are you doing today?", 30),
      msg("m1-2", CURRENT_USER_ID, "Pretty good, thanks for asking!", 28),
      msg("m1-3", "aslan", "Want to catch up later?", 20),
      msg("m1-4", CURRENT_USER_ID, "Sure, sounds great!", 5),
    ],
  },
  {
    id: "thread-2",
    title: "Chat 2",
    type: "user",
    participantName: "Moana",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 12),
    messages: [
      msg("m2-1", "moana", "Did you finish the project?", 60),
      msg("m2-2", CURRENT_USER_ID, "Almost there, just final touches.", 55),
      msg("m2-3", "moana", "Let me know when it is ready 🚀", 12),
    ],
  },
  {
    id: "thread-3",
    title: "Chat 3",
    type: "ai",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 45),
    messages: [
      msg("m3-1", "ai", "Hello! How can I assist you today?", 90),
      msg("m3-2", CURRENT_USER_ID, "Tell me about framer-motion animations.", 88),
      msg(
        "m3-3",
        "ai",
        "Framer Motion is a production-ready animation library for React. It provides simple APIs for declarative animations, gestures, and layout transitions.",
        45,
      ),
    ],
  },
];
