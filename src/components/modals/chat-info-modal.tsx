"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, Users, Phone, FileText, Camera, Save } from "lucide-react";
import type { ChatThread } from "@/types/chat";
import type { UserProfile } from "@/types/profile";
import type { Session } from "@/types/auth";
import { fetchFullProfile, fetchCommonGroups, fetchGroupMembers } from "@/lib/supabase-api";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

interface ChatInfoModalProps {
  open: boolean;
  thread: ChatThread | null;
  currentUserId: string;
  onClose: () => void;
  onUpdateThread: (
    threadId: string,
    updates: { avatarUrl?: string | null; description?: string | null },
  ) => Promise<void>;
}

export function ChatInfoModal({
  open,
  thread,
  currentUserId,
  onClose,
  onUpdateThread,
}: ChatInfoModalProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [peerProfile, setPeerProfile] = useState<UserProfile | null>(null);
  const [commonGroups, setCommonGroups] = useState<{ id: string; title: string }[]>([]);
  const [groupMembers, setGroupMembers] = useState<Session[]>([]);
  const [localAvatarUrl, setLocalAvatarUrl] = useState("");
  const [localDescription, setLocalDescription] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !thread) return;

    void (async () => {
      if (thread.type === "group") {
        setLocalAvatarUrl(thread.avatarUrl ?? "");
        setLocalDescription(thread.description ?? "");
      }

      if (!isSupabaseConfigured) return;

      setPeerProfile(null);
      setCommonGroups([]);
      setGroupMembers([]);
      setLoading(true);

      if (thread.type === "p2p" && thread.peerId) {
        const [profile, groups] = await Promise.all([
          fetchFullProfile(thread.peerId),
          fetchCommonGroups(currentUserId, thread.peerId),
        ]);
        setPeerProfile(profile);
        setCommonGroups(groups);
      } else if (thread.type === "group") {
        const members = await fetchGroupMembers(thread.id);
        setGroupMembers(members);
      }
      setLoading(false);
    })();
  }, [open, thread, currentUserId]);

  useEffect(() => {
    if (open) return;
    (() => {
      setPeerProfile(null);
      setCommonGroups([]);
      setGroupMembers([]);
      setLocalAvatarUrl("");
      setLocalDescription("");
      setSaved(false);
    })();
  }, [open]);

  const handleGroupAvatarChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file || !thread || !supabase) return;
    setAvatarUploading(true);
    void (async () => {
      const nameParts = file.name.split(".");
      const ext = nameParts.length > 1 ? (nameParts.pop() ?? "png") : "png";
      const filePath = `group_${thread.id}_${Date.now().toString()}.${ext}`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });
      if (error) {
        console.error("[group-avatar] upload:", error.message);
        setAvatarUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setLocalAvatarUrl(urlData.publicUrl);
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    })();
  };

  const handleSaveGroup = (): void => {
    if (!thread) return;
    setSaving(true);
    void (async () => {
      await onUpdateThread(thread.id, {
        avatarUrl: localAvatarUrl.trim() || null,
        description: localDescription.trim() || null,
      });
      setSaving(false);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
      }, 2000);
    })();
  };

  if (!thread) return <></>;

  const isAi = thread.type === "ai";
  const isP2P = thread.type === "p2p";
  const isGroup = thread.type === "group";
  const peerAvatar = isP2P ? (peerProfile?.avatarUrl ?? thread.avatarUrl) : null;
  const displayGroupAvatar = localAvatarUrl.trim() || null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden max-h-[80vh] flex flex-col pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-base font-semibold text-gray-900">
                  {isAi ? "Bot Info" : isGroup ? "Group Info" : "Profile"}
                </h2>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="overflow-y-auto flex-1">
                {/* Hero */}
                <div className="flex flex-col items-center pt-6 pb-4 px-5">
                  {isGroup ? (
                    /* Interactive group avatar with file upload */
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                      aria-label="Change group photo"
                      className="relative w-20 h-20 rounded-full mb-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
                    >
                      {displayGroupAvatar ? (
                        <img
                          src={displayGroupAvatar}
                          alt={thread.title}
                          className="w-20 h-20 rounded-full object-cover ring-4 ring-violet-100"
                        />
                      ) : (
                        <span className="w-20 h-20 rounded-full bg-violet-600 flex items-center justify-center ring-4 ring-violet-100">
                          <Users size={28} className="text-white" strokeWidth={1.5} />
                        </span>
                      )}
                      {!avatarUploading && (
                        <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5 pointer-events-none">
                          <Camera size={18} className="text-white" strokeWidth={2} />
                          <span className="text-[10px] font-semibold text-white leading-none">
                            Upload
                          </span>
                        </span>
                      )}
                      {avatarUploading && (
                        <span className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center pointer-events-none">
                          <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        </span>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleGroupAvatarChange}
                      />
                    </button>
                  ) : isAi ? (
                    <span className="w-20 h-20 rounded-full bg-violet-600 flex items-center justify-center mb-3">
                      <Bot size={32} className="text-white" strokeWidth={1.5} />
                    </span>
                  ) : peerAvatar ? (
                    <img
                      src={peerAvatar}
                      alt={thread.title}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-violet-100 mb-3"
                    />
                  ) : (
                    <span className="w-20 h-20 rounded-full bg-violet-600 flex items-center justify-center text-2xl font-bold text-white ring-4 ring-violet-100 mb-3">
                      {thread.title.slice(0, 1).toUpperCase()}
                    </span>
                  )}

                  <h3 className="text-lg font-bold text-gray-900 text-center">{thread.title}</h3>
                  {isAi && (
                    <p className="text-sm text-violet-500 font-medium mt-0.5">AI Assistant</p>
                  )}
                  {isGroup && (
                    <p className="text-xs text-gray-400 mt-0.5">Tap avatar to change photo</p>
                  )}
                </div>

                {loading && (
                  <div className="flex justify-center py-6">
                    <div className="w-5 h-5 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
                  </div>
                )}

                {/* AI */}
                {isAi && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-gray-500 text-center bg-gray-50 rounded-xl px-4 py-3">
                      AI-powered assistant. Ask me anything — I&apos;m here to help.
                    </p>
                  </div>
                )}

                {/* P2P */}
                {isP2P && !loading && (
                  <div className="px-5 pb-5 flex flex-col gap-3">
                    {peerProfile?.phone && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                        <Phone size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-400 font-medium mb-0.5">Phone</p>
                          <p className="text-sm text-gray-900">{peerProfile.phone}</p>
                        </div>
                      </div>
                    )}
                    {peerProfile?.bio && (
                      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                        <FileText size={15} className="text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-400 font-medium mb-0.5">Bio</p>
                          <p className="text-sm text-gray-900">{peerProfile.bio}</p>
                        </div>
                      </div>
                    )}
                    {commonGroups.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                          Common Groups · {commonGroups.length}
                        </p>
                        <ul className="flex flex-col gap-1">
                          {commonGroups.map((g) => (
                            <li
                              key={g.id}
                              className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl"
                            >
                              <span className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                                <Users size={13} className="text-violet-600" />
                              </span>
                              <span className="text-sm text-gray-800 font-medium truncate">
                                {g.title}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {!peerProfile?.phone && !peerProfile?.bio && commonGroups.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-xl">
                        No additional info
                      </p>
                    )}
                  </div>
                )}

                {/* Group: description + save + members */}
                {isGroup && !loading && (
                  <div className="px-5 pb-5 flex flex-col gap-4">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
                        <FileText size={12} />
                        Group Description
                      </label>
                      <textarea
                        value={localDescription}
                        onChange={(e) => {
                          setLocalDescription(e.target.value);
                        }}
                        placeholder="What's this group about?"
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                      />
                    </div>

                    <button
                      onClick={handleSaveGroup}
                      disabled={saving || avatarUploading}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-gray-200 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                    >
                      <Save size={14} />
                      {saving ? "Saving…" : saved ? "Saved!" : "Save Group Settings"}
                    </button>

                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                        Members · {groupMembers.length}
                      </p>
                      <ul className="flex flex-col gap-1">
                        {groupMembers.map((m) => (
                          <li
                            key={m.id}
                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-xl transition-colors"
                          >
                            {m.avatarUrl ? (
                              <img
                                src={m.avatarUrl}
                                alt={m.username}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <span className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {m.username.slice(0, 1).toUpperCase()}
                              </span>
                            )}
                            <span className="text-sm font-medium text-gray-800 truncate">
                              {m.username}
                            </span>
                          </li>
                        ))}
                        {groupMembers.length === 0 && (
                          <li className="text-sm text-gray-400 text-center py-4">
                            No members found
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
