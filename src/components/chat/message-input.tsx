"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Check, Cpu, Sparkles, Bot, Layers, Smile } from "lucide-react";
import { AI_MODELS, DEFAULT_MODEL_ID, getModelConfig } from "@/types/ai-model";
import type { AiModelId, AgentIconKey } from "@/types/ai-model";

interface MessageInputProps {
  onSend: (text: string, modelId?: AiModelId) => void;
  disabled?: boolean;
  isAiThread?: boolean;
  currentUserId?: string;
}

const AGENT_ICONS: Record<AgentIconKey, React.ElementType> = {
  gpt: Cpu,
  gemini: Sparkles,
  claude: Bot,
  deepseek: Layers,
};

const POPULAR_EMOJIS = ["😀", "😂", "😍", "👍", "🔥", "🎉", "🚀", "❤️"];

export function MessageInput({
  onSend,
  disabled = false,
  isAiThread = false,
}: MessageInputProps): React.JSX.Element {
  const [value, setValue] = useState("");
  const [selectedModel, setSelectedModel] = useState<AiModelId>(DEFAULT_MODEL_ID);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const emojiTriggerRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!popoverOpen) return;
    function handleOutsideClick(e: MouseEvent): void {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [popoverOpen]);

  useEffect(() => {
    if (!emojiOpen) return;
    function handleOutsideClick(e: MouseEvent): void {
      const target = e.target as Node;
      if (
        emojiRef.current &&
        !emojiRef.current.contains(target) &&
        emojiTriggerRef.current &&
        !emojiTriggerRef.current.contains(target)
      ) {
        setEmojiOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [emojiOpen]);

  const handleSubmit = (): void => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    if (isAiThread) {
      onSend(trimmed, selectedModel);
    } else {
      onSend(trimmed);
    }
    setValue("");
    setEmojiOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const insertEmoji = (emoji: string): void => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setValue((prev) => prev + emoji);
      setEmojiOpen(false);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.slice(0, start) + emoji + value.slice(end);
    setValue(newValue);
    setEmojiOpen(false);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const activeModel = getModelConfig(selectedModel);
  const ActiveIcon = AGENT_ICONS[activeModel.iconKey];
  const hasText = value.trim().length > 0;
  const placeholder = isAiThread ? `Message ${activeModel.name}…` : "Write a message...";
  const canEmoji = !isAiThread;

  return (
    <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-gray-100">
      <div className="flex items-end gap-2">
        {/* ── Agent selector — AI threads only ───────────────────────── */}
        {isAiThread && (
          <div className="relative flex-shrink-0 self-end mb-0.5">
            <button
              ref={triggerRef}
              type="button"
              onClick={() => {
                setPopoverOpen((o) => !o);
              }}
              aria-label={`Engine: ${activeModel.name}. Click to switch.`}
              aria-expanded={popoverOpen}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-violet-400 shadow-sm"
              style={{ backgroundColor: activeModel.iconColor }}
            >
              <ActiveIcon size={16} strokeWidth={2} />
            </button>

            <AnimatePresence>
              {popoverOpen && (
                <motion.div
                  ref={popoverRef}
                  role="listbox"
                  aria-label="Select AI engine"
                  initial={{ opacity: 0, scale: 0.95, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
                >
                  <div className="px-3.5 py-2.5 border-b border-gray-100">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                      AI Engine
                    </p>
                  </div>
                  {AI_MODELS.map((model) => {
                    const isActive = model.id === selectedModel;
                    const ItemIcon = AGENT_ICONS[model.iconKey];
                    return (
                      <button
                        key={model.id}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        onClick={() => {
                          setSelectedModel(model.id);
                          setPopoverOpen(false);
                        }}
                        className={[
                          "w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors",
                          isActive ? "bg-gray-50" : "hover:bg-gray-50",
                        ].join(" ")}
                      >
                        <span
                          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm"
                          style={{ backgroundColor: model.iconColor }}
                        >
                          <ItemIcon size={15} strokeWidth={2} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {model.name}
                            </p>
                            {isActive && (
                              <Check size={13} className="flex-shrink-0 text-violet-600" />
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 truncate">{model.tagline}</p>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Emoji picker — non-AI threads only ─────────────────────── */}
        {canEmoji && (
          <div className="relative flex-shrink-0 self-end mb-0.5">
            <button
              ref={emojiTriggerRef}
              type="button"
              onClick={() => {
                setEmojiOpen((o) => !o);
              }}
              aria-label="Insert emoji"
              aria-expanded={emojiOpen}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-violet-600 hover:bg-violet-50 transition-colors"
            >
              <Smile size={18} strokeWidth={1.8} />
            </button>

            <AnimatePresence>
              {emojiOpen && (
                <motion.div
                  ref={emojiRef}
                  initial={{ opacity: 0, scale: 0.95, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute bottom-full left-0 mb-2 z-50 p-2 bg-white border border-gray-200 rounded-xl shadow-xl grid grid-cols-4 gap-2 w-44 h-auto min-w-[170px]"
                >
                  {POPULAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        insertEmoji(emoji);
                      }}
                      className="hover:bg-gray-100 p-1.5 rounded-md text-xl transition-colors"
                      aria-label={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Textarea ───────────────────────────────────────────────── */}
        <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 focus-within:bg-gray-50 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full resize-none bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none leading-relaxed max-h-28 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
          />
        </div>

        {/* ── Send button ────────────────────────────────────────────── */}
        <button
          onClick={handleSubmit}
          disabled={!hasText || disabled}
          aria-label="Send message"
          className={[
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors mb-0.5",
            hasText && !disabled
              ? "text-violet-600 hover:text-violet-700 hover:bg-violet-50"
              : "text-gray-400 cursor-not-allowed",
          ].join(" ")}
        >
          <Send size={18} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
