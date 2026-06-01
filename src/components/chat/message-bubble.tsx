"use client";

import { motion } from "framer-motion";
import type { Message } from "@/types/chat";
import { formatTime } from "@/lib/utils";
import { CheckCheck, Clock, AlertCircle } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
}

const statusIcon = {
  sent: <CheckCheck size={12} className="text-violet-300" />,
  sending: <Clock size={12} className="text-violet-300/60" />,
  failed: <AlertCircle size={12} className="text-red-400" />,
};

export function MessageBubble({ message, currentUserId }: MessageBubbleProps): React.JSX.Element {
  const isOwn = message.senderId === currentUserId;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.93, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={["flex", isOwn ? "justify-end" : "justify-start"].join(" ")}
    >
      <div
        className={[
          "max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          isOwn
            ? "bg-violet-600 text-white rounded-br-sm"
            : "bg-gray-100 text-gray-800 rounded-bl-sm",
        ].join(" ")}
      >
        <p>{message.text}</p>
        <div
          className={["flex items-center gap-1 mt-1", isOwn ? "justify-end" : "justify-start"].join(
            " ",
          )}
        >
          <span className={["text-xs", isOwn ? "text-violet-200" : "text-gray-400"].join(" ")}>
            {formatTime(message.timestamp)}
          </span>
          {isOwn && statusIcon[message.status]}
        </div>
      </div>
    </motion.div>
  );
}
