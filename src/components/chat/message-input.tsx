"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled = false }: MessageInputProps): React.JSX.Element {
  const [value, setValue] = useState("");

  const handleSubmit = (): void => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="px-4 py-4 border-t border-zinc-800 bg-zinc-900">
      <div className="flex items-end gap-3 bg-zinc-800 rounded-2xl px-4 py-3 border border-zinc-700 focus-within:border-violet-500 transition-colors">
        <textarea
          rows={1}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Write a message..."
          disabled={disabled}
          className="flex-1 resize-none bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none leading-relaxed max-h-32 overflow-y-auto"
          style={{ scrollbarWidth: "none" }}
        />
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          aria-label="Send message"
          className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-700 disabled:cursor-not-allowed"
        >
          <Send size={15} className="text-white" />
        </button>
      </div>
      <p className="mt-1.5 text-center text-xs text-zinc-600">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
