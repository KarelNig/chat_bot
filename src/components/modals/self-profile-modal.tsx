"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Phone, FileText, Save } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { fetchFullProfile, updateProfile } from "@/lib/supabase-api";
import { supabase } from "@/lib/supabase";
import type { UserProfile } from "@/types/profile";

interface SelfProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function SelfProfileModal({ open, onClose }: SelfProfileModalProps): React.JSX.Element {
  const { user, updateUserAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    void (async () => {
      setProfile(null);
      const p = await fetchFullProfile(user.id);
      if (p) {
        setProfile(p);
        setAvatarUrl(p.avatarUrl ?? "");
        setPhone(p.phone ?? "");
        setBio(p.bio ?? "");
      }
    })();
  }, [open, user]);

  const handleAvatarClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file || !user || !supabase) return;

    setUploading(true);
    void (async () => {
      const nameParts = file.name.split(".");
      const ext = nameParts.length > 1 ? (nameParts.pop() ?? "png") : "png";
      const filePath = `avatar_${user.id}_${Date.now().toString()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("[avatar] upload failed:", uploadError.message);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(urlData.publicUrl);
      setUploading(false);

      // Reset so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    })();
  };

  const handleSave = (): void => {
    if (!user) return;
    setSaving(true);
    void (async () => {
      const newAvatarUrl = avatarUrl.trim() || null;
      await updateProfile(user.id, {
        avatarUrl: newAvatarUrl,
        phone: phone.trim() || null,
        bio: bio.trim() || null,
      });
      updateUserAvatar(newAvatarUrl);
      setSaving(false);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
      }, 2000);
    })();
  };

  const displayAvatar = avatarUrl.trim() || null;
  const isBusy = uploading || saving;

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
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden pointer-events-auto">
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">My Profile</h2>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Interactive avatar circle */}
              <div className="flex flex-col items-center pt-6 pb-3">
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={uploading}
                  className="relative w-20 h-20 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 group"
                  aria-label="Change profile photo"
                >
                  {/* Avatar image or initial */}
                  {displayAvatar ? (
                    <img
                      src={displayAvatar}
                      alt="avatar"
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-violet-100"
                    />
                  ) : (
                    <span className="w-20 h-20 rounded-full bg-violet-600 flex items-center justify-center text-2xl font-bold text-white ring-4 ring-violet-100">
                      {user?.username.slice(0, 1).toUpperCase()}
                    </span>
                  )}

                  {/* Hover overlay — hidden while uploading */}
                  {!uploading && (
                    <span className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-0.5 pointer-events-none">
                      <Camera size={18} className="text-white" strokeWidth={2} />
                      <span className="text-[10px] font-semibold text-white leading-none">
                        Change
                      </span>
                    </span>
                  )}

                  {/* Upload spinner overlay */}
                  {uploading && (
                    <span className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center pointer-events-none">
                      <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    </span>
                  )}

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </button>

                <p className="mt-3 text-sm font-semibold text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-400 mt-0.5">Tap avatar to change photo</p>
              </div>

              {/* Form fields */}
              <div className="px-5 pb-5 flex flex-col gap-3">
                {profile === null ? (
                  <div className="flex justify-center py-2">
                    <div className="w-4 h-4 rounded-full border-2 border-violet-600 border-t-transparent animate-spin" />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                        <Phone size={12} />
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                        }}
                        placeholder="+1 234 567 8900"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                        <FileText size={12} />
                        Bio
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => {
                          setBio(e.target.value);
                        }}
                        placeholder="Tell others about yourself…"
                        rows={3}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                      />
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={isBusy}
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-gray-200 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
                    >
                      <Save size={14} />
                      {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
