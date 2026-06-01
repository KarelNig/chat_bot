"use client";

import { useState, useEffect, useRef } from "react";
import { Users, Search } from "lucide-react";
import type { Session } from "@/types/auth";
import { searchProfiles } from "@/lib/supabase-api";
import { isSupabaseConfigured } from "@/lib/supabase";

interface UserSearchProps {
  currentUserId: string;
  onSelectUser: (user: Session) => void;
}

export function UserSearch({ currentUserId, onSelectUser }: UserSearchProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Session[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when panel opens (no setState needed here)
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Debounced search — only calls setResults inside async callback, not synchronously
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const timer = setTimeout(() => {
      setSearching(true);
      void (async () => {
        const found = await searchProfiles(trimmed, currentUserId);
        setResults(found);
        setSearching(false);
      })();
    }, 300);
    return () => {
      clearTimeout(timer);
    };
  }, [query, currentUserId]);

  const handleClose = (): void => {
    setOpen(false);
    setQuery("");
    setResults([]);
  };

  const handleSelect = (user: Session): void => {
    onSelectUser(user);
    handleClose();
  };

  // Derive: only show results when query is non-empty
  const displayResults = query.trim() ? results : [];

  if (!isSupabaseConfigured) return <></>;

  return (
    <div className="px-3 pb-2">
      {!open ? (
        <button
          onClick={() => {
            setOpen(true);
          }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors border border-dashed border-gray-200"
        >
          <Users size={14} />
          Find People
        </button>
      ) : (
        <div className="flex flex-col gap-1">
          <label className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-violet-300 ring-2 ring-violet-100">
            <Search size={14} className="text-violet-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
              placeholder="Search by username…"
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
            />
            <button onClick={handleClose} className="text-xs text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </label>

          {searching && <p className="text-xs text-gray-400 px-2 py-1">Searching…</p>}

          {!searching && displayResults.length > 0 && (
            <ul className="flex flex-col gap-0.5 mt-0.5">
              {displayResults.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => {
                      handleSelect(u);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-violet-50 transition-colors text-left"
                  >
                    <span className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {u.username.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="text-sm font-medium text-gray-800 truncate">{u.username}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!searching && query.trim() && displayResults.length === 0 && (
            <p className="text-xs text-gray-400 px-2 py-1">No users found</p>
          )}
        </div>
      )}
    </div>
  );
}
