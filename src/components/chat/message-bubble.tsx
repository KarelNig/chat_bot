"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCheck, Check, AlertCircle } from "lucide-react";
import { BOT_SENDER_ID, type Message } from "@/types/chat";
import { getModelConfig } from "@/types/ai-model";
import { formatTime } from "@/lib/utils";

interface MessageBubbleProps {
  message: Message;
  currentUserId: string;
}

const STATUS_CONFIG = {
  sent: { Icon: CheckCheck, className: "text-violet-200", label: "Sent" },
  sending: { Icon: Check, className: "text-gray-300", label: "Sending…" },
  failed: { Icon: AlertCircle, className: "text-red-300", label: "Failed" },
};

// ── Inline markdown: **bold**, *italic*, `code` ───────────────────────────────
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/);
  return (
    <>
      {parts.map((part, i): React.ReactNode => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          return (
            <strong key={i} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return <em key={i}>{part.slice(1, -1)}</em>;
        }
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          return (
            <code
              key={i}
              className="bg-gray-100 text-gray-800 rounded px-1 py-0.5 text-[11px] font-mono"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      })}
    </>
  );
}

// ── Block markdown renderer ───────────────────────────────────────────────────
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="text-sm font-bold text-gray-900 mt-2 mb-0.5">
          {renderInline(line.slice(4))}
        </h3>,
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="text-sm font-bold text-gray-900 mt-2.5 mb-1">
          {renderInline(line.slice(3))}
        </h2>,
      );
    } else if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="text-base font-bold text-gray-900 mt-3 mb-1">
          {renderInline(line.slice(2))}
        </h1>,
      );
    } else if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${String(i)}`} className="list-disc pl-4 my-1 space-y-0.5">
          {items.map((item, j) => (
            <li key={j} className="text-gray-800 text-sm leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ul>,
      );
      continue;
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${String(i)}`} className="list-decimal pl-4 my-1 space-y-0.5">
          {items.map((item, j) => (
            <li key={j} className="text-gray-800 text-sm leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ol>,
      );
      continue;
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-1.5" />);
    } else {
      elements.push(
        <p key={i} className="text-gray-800 text-sm leading-relaxed">
          {renderInline(line)}
        </p>,
      );
    }

    i++;
  }

  return <>{elements}</>;
}

export function MessageBubble({ message, currentUserId }: MessageBubbleProps): React.JSX.Element {
  const isOwn = message.senderId === currentUserId;
  const isBotMessage = message.senderId === BOT_SENDER_ID || message.modelId !== undefined;
  const { Icon, className, label } = STATUS_CONFIG[message.status];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.93, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={["flex", isOwn ? "justify-end" : "justify-start"].join(" ")}
    >
      {isOwn ? (
        /* ── User bubble: violet ── */
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
        /* ── Incoming bubble: white (AI or peer) ── */
        <div className="max-w-[75%] md:max-w-[62%] rounded-2xl rounded-bl-sm bg-white border border-gray-100 px-4 pt-2.5 pb-2 text-sm leading-relaxed shadow-sm">
          {isBotMessage ? (
            renderMarkdown(message.text)
          ) : (
            <p className="text-gray-800 whitespace-pre-wrap">{message.text}</p>
          )}
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
