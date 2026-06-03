"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageSquare, UserPlus, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function RegisterPage(): React.JSX.Element {
  const { register } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>): void => {
    e.preventDefault();
    let valid = true;
    if (!username.trim()) {
      setUsernameError("Username is required.");
      valid = false;
    } else if (username.trim().length < 3) {
      setUsernameError("At least 3 characters required.");
      valid = false;
    } else {
      setUsernameError("");
    }
    if (!password) {
      setPasswordError("Password is required.");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("At least 6 characters required.");
      valid = false;
    } else {
      setPasswordError("");
    }
    if (!valid) return;

    setBusy(true);
    void (async () => {
      const err = await register(username, password);
      if (err) {
        if (err.toLowerCase().includes("username") || err.toLowerCase().includes("taken")) {
          setUsernameError(err);
        } else if (err.toLowerCase().includes("password")) {
          setPasswordError(err);
        } else {
          setUsernameError(err);
        }
        setBusy(false);
      } else {
        router.replace("/");
      }
    })();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <span className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
            <MessageSquare size={20} className="text-white" />
          </span>
          <span className="text-2xl font-bold text-gray-900 tracking-tight">Zimran Chat</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Create account</h1>
          <p className="text-sm text-gray-500 mb-6">Pick a unique username and set a password</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoFocus
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (usernameError) setUsernameError("");
                }}
                placeholder="min. 3 characters"
                className={[
                  "w-full px-3.5 py-2.5 rounded-xl border text-sm text-gray-900 placeholder-gray-400 outline-none transition-all",
                  usernameError
                    ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                    : "border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100",
                ].join(" ")}
              />
              {usernameError && <p className="text-xs text-red-500 mt-1">{usernameError}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  placeholder="min. 6 characters"
                  className={[
                    "w-full px-3.5 py-2.5 pr-10 rounded-xl border text-sm text-gray-900 placeholder-gray-400 outline-none transition-all",
                    passwordError
                      ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                      : "border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100",
                  ].join(" ")}
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowPassword((v) => !v);
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordError && <p className="text-xs text-red-500 mt-1">{passwordError}</p>}
            </div>

            <button
              type="submit"
              disabled={busy}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-gray-200 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors mt-1"
            >
              <UserPlus size={15} />
              {busy ? "Creating account…" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already registered?{" "}
          <Link href="/login" className="text-violet-600 hover:text-violet-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
