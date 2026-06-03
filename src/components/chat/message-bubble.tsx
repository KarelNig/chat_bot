"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCheck, Clock, AlertCircle } from "lucide-react";
import type { Message } from "@/types/chat";
import { getModelConfig } from "@/types/ai-model";
import { formatTime } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
}

const STATUS_CONFIG = {
  sent: { Icon: CheckCheck, className: "text-violet-200", label: "Sent" },
  sending: { Icon: Clock, className: "text-violet-200/60", label: "Sending…" },
  failed: { Icon: AlertCircle, className: "text-red-300", label: "Failed" },
};

export function MessageBubble({ message, currentUserId }: MessageBubbleProps): React.JSX.Element {
  const isOwn = message.senderId === currentUserId;
  const { Icon, className, label } = STATUS_CONFIG[message.status];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.93, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={["flex", isOwn ? "justify-end" : "justify-start"].join(" ")}
    >
      {isOwn ? (
        /* ── User bubble: violet, timestamp inside bottom-right ── */
        <div className="max-w-[75%] md:max-w-[62%] rounded-2xl rounded-br-sm bg-violet-500 px-4 pt-2.5 pb-2 text-sm leading-relaxed shadow-sm">
          <p className="text-white">{message.text}</p>
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[11px] text-violet-200">{formatTime(message.timestamp)}</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={message.status}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15 }}
                aria-label={label}
              >
                <Icon size={11} className={className} />
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      ) : (
        /* ── AI bubble: pure white, dark text, subtle border + shadow ── */
        <div className="max-w-[75%] md:max-w-[62%] rounded-2xl rounded-bl-sm bg-white border border-gray-100 px-4 pt-2.5 pb-2 text-sm leading-relaxed shadow-sm">
          <p className="text-gray-800 whitespace-pre-wrap">{message.text}</p>
          <div className="flex items-center justify-start gap-2 mt-1 flex-wrap">
            <span className="text-[11px] text-gray-400">{formatTime(message.timestamp)}</span>
            {message.modelId && (
              <span
                className={[
                  "text-[10px] font-medium px-1.5 py-0.5 rounded-full border",
                  getModelConfig(message.modelId).badgeClass,
                ].join(" ")}
              >
                via {getModelConfig(message.modelId).name}
              </span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
