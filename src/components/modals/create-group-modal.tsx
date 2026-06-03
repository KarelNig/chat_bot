"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Search, Check } from "lucide-react";
import { searchProfiles } from "@/lib/supabase-api";
import type { Session } from "@/types/auth";

interface CreateGroupModalProps {
  open: boolean;
  currentUserId: string;
  onClose: () => void;
  onCreate: (title: string, memberIds: string[]) => void;
}

export function CreateGroupModal({
  open,
  currentUserId,
  onClose,
  onCreate,
}: CreateGroupModalProps): React.JSX.Element {
  const [title, setTitle] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Session[]>([]);
  const [selected, setSelected] = useState<Session[]>([]);
  const [searching, setSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (q: string): void => {
    setQuery(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    timerRef.current = setTimeout(() => {
      setSearching(true);
      void (async () => {
        const found = await searchProfiles(q.trim(), currentUserId);
        setResults(found);
        setSearching(false);
      })();
    }, 300);
  };

  const toggleSelect = (user: Session): void => {
    setSelected((prev) =>
      prev.some((s) => s.id === user.id) ? prev.filter((s) => s.id !== user.id) : [...prev, user],
    );
  };

  const handleCreate = (): void => {
    if (!title.trim() || selected.length === 0) return;
    onCreate(
      title.trim(),
      selected.map((s) => s.id),
    );
    setTitle("");
    setQuery("");
    setResults([]);
    setSelected([]);
    onClose();
  };

  const handleClose = (): void => {
    setTitle("");
    setQuery("");
    setResults([]);
    setSelected([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 16 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden max-h-[80vh] flex flex-col pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-violet-600" />
                  <h2 className="text-base font-semibold text-gray-900">New Group</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
                {/* Group name input */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Group name</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                    }}
                    placeholder="e.g. Team Alpha"
                    autoFocus
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                  />
                </div>

                {/* Selected member badges */}
                {selected.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selected.map((u) => (
                      <span
                        key={u.id}
                        className="flex items-center gap-1 px-2.5 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium"
                      >
                        {u.username}
                        <button
                          onClick={() => {
                            toggleSelect(u);
                          }}
                          className="text-violet-400 hover:text-violet-700 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* User search */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Add members
                  </label>
                  <label className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-200 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
                    <Search size={13} className="text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => {
                        handleSearch(e.target.value);
                      }}
                      placeholder="Search by username…"
                      className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                    />
                  </label>

                  {searching && <p className="text-xs text-gray-400 px-1 mt-1.5">Searching…</p>}

                  {!searching && results.length > 0 && (
                    <ul className="mt-1.5 flex flex-col gap-0.5">
                      {results.map((u) => {
                        const isSelected = selected.some((s) => s.id === u.id);
                        return (
                          <li key={u.id}>
                            <button
                              onClick={() => {
                                toggleSelect(u);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-violet-50 transition-colors text-left"
                            >
                              {u.avatarUrl ? (
                                <img
                                  src={u.avatarUrl}
                                  alt={u.username}
                                  className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <span className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                  {u.username.slice(0, 1).toUpperCase()}
                                </span>
                              )}
                              <span className="flex-1 text-sm font-medium text-gray-800 truncate">
                                {u.username}
                              </span>
                              {isSelected && (
                                <Check size={14} className="text-violet-600 flex-shrink-0" />
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {!searching && query.trim() && results.length === 0 && (
                    <p className="text-xs text-gray-400 px-1 mt-1.5">No users found</p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100">
                <button
                  onClick={handleCreate}
                  disabled={!title.trim() || selected.length === 0}
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-gray-200 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                >
                  {selected.length > 0
                    ? `Create Group (${(selected.length + 1).toString()} members)`
                    : "Create Group"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
