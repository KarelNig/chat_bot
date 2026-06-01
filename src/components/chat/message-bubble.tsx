"use client";

import { motion } from "framer-motion";
import type { Message } from "@/types/chat";
import { CURRENT_USER_ID } from "@/types/chat";
import { formatTime } from "@/lib/utils";
import { CheckCheck, Clock, AlertCircle } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
}

const statusIcon = {
  sent: <CheckCheck size={12} className="text-violet-300" />,
  sending: <Clock size={12} className="text-zinc-400" />,
  failed: <AlertCircle size={12} className="text-red-400" />,
};

export function MessageBubble({ message }: MessageBubbleProps): React.JSX.Element {
  const isOwn = message.senderId === CURRENT_USER_ID;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={["flex", isOwn ? "justify-end" : "justify-start"].join(" ")}
    >
      <div
        className={[
          "max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isOwn
            ? "bg-violet-600 text-white rounded-br-sm"
            : "bg-zinc-800 text-zinc-100 rounded-bl-sm",
        ].join(" ")}
      >
        <p>{message.text}</p>
        <div
          className={["flex items-center gap-1 mt-1", isOwn ? "justify-end" : "justify-start"].join(
            " ",
          )}
        >
          <span className={["text-xs", isOwn ? "text-violet-300" : "text-zinc-500"].join(" ")}>
            {formatTime(message.timestamp)}
          </span>
          {isOwn && statusIcon[message.status]}
        </div>
      </div>
    </motion.div>
  );
}
