"use client";

import { X, LogOut, UserCog } from "lucide-react";
import type { Session } from "@/types/auth";

interface ProfileInfoModalProps {
  open: boolean;
  user: Session;
  onClose: () => void;
  onLogout: () => void;
  onEditProfile?: () => void;
}

export function ProfileInfoModal({
  open,
  user,
  onClose,
  onLogout,
  onEditProfile,
}: ProfileInfoModalProps): React.JSX.Element | null {
  if (!open) return null;

  const handleLogout = (): void => {
    onLogout();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center gap-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-info-title"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Avatar */}
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="w-20 h-20 rounded-full object-cover ring-4 ring-violet-100"
          />
        ) : (
          <span className="w-20 h-20 rounded-full bg-violet-600 flex items-center justify-center text-3xl font-bold text-white ring-4 ring-violet-100">
            {user.username.slice(0, 1).toUpperCase()}
          </span>
        )}

        {/* Name / handle */}
        <div className="text-center" id="profile-info-title">
          <p className="text-lg font-bold text-gray-900">{user.username}</p>
          <p className="text-sm text-gray-400 mt-0.5">@{user.username.toLowerCase()}</p>
        </div>

        <div className="w-full border-t border-gray-100" />

        <div className="w-full flex flex-col gap-2">
          {onEditProfile && (
            <button
              onClick={() => {
                onEditProfile();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-50 text-violet-700 font-semibold text-sm hover:bg-violet-100 active:bg-violet-200 transition-colors"
            >
              <UserCog size={16} strokeWidth={2} />
              Edit Profile
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 active:bg-red-200 transition-colors"
          >
            <LogOut size={16} strokeWidth={2} />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
