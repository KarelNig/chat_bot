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
    type: "p2p",
    participantName: "Aslan",
    peerId: "peer-aslan",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 5),
    messages: [
      msg("m1-1", "peer-aslan", "Hey, how are you doing today?", 30),
      msg("m1-2", CURRENT_USER_ID, "Pretty good, thanks for asking!", 28),
      msg("m1-3", "peer-aslan", "Want to catch up later?", 20),
      msg("m1-4", CURRENT_USER_ID, "Sure, sounds great!", 5),
    ],
  },
  {
    id: "thread-2",
    title: "Moana",
    type: "p2p",
    participantName: "Moana",
    peerId: "peer-moana",
    lastUpdated: new Date(Date.now() - 1000 * 60 * 12),
    messages: [
      msg("m2-1", "peer-moana", "Did you finish the project?", 60),
      msg("m2-2", CURRENT_USER_ID, "Almost there, just final touches.", 55),
      msg("m2-3", "peer-moana", "Let me know when it is ready 🚀", 12),
    ],
  },
  {
    id: "thread-3",
    title: "AI Assistant",
    type: "ai",
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
