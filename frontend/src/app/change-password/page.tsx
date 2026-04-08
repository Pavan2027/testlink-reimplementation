"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { TestTube2, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function ChangePasswordPage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (!loading && user && !user.must_change_password) {
      router.push("/dashboard");
    }
  }, [user, loading]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.new_password.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (form.new_password !== form.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }
    if (form.new_password === form.current_password) {
      toast.error("New password must be different from your temporary password");
      return;
    }

    setSubmitting(true);
    try {
      await authApi.changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
      });
      await refresh();
      toast.success("Password changed successfully. Welcome!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to change password");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return null;

  const passwordStrength = Math.min(
    Math.floor(form.new_password.length / 3) +
    (form.new_password.length >= 8 ? 1 : 0),
    4
  );

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <TestTube2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">TestLink</span>
          </div>
        </div>

        <div className="card p-8">
          <div className="flex items-start gap-3 mb-6 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-400">Password change required</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                Welcome, {user.full_name.split(" ")[0]}! Your account was created with a
                temporary password. Please set a new password to continue.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Temporary Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={form.current_password}
                  onChange={set("current_password")}
                  placeholder="Enter your temporary password"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
                />
                <button type="button" onClick={() => setShowCurrent(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="border-t border-[hsl(var(--border))]" />

            {/* New password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={form.new_password}
                  onChange={set("new_password")}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
                />
                <button type="button" onClick={() => setShowNew(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength bar */}
              {form.new_password && (
                <div className="flex gap-1 mt-1.5">
                  {[1, 2, 3, 4].map(level => (
                    <div key={level} className={`h-1 flex-1 rounded-full transition-colors ${
                      level <= passwordStrength
                        ? passwordStrength <= 1 ? "bg-red-500"
                        : passwordStrength <= 2 ? "bg-amber-500"
                        : passwordStrength <= 3 ? "bg-blue-500"
                        : "bg-emerald-500"
                        : "bg-[hsl(var(--border))]"
                    }`} />
                  ))}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Confirm New Password</label>
              <input
                type="password"
                value={form.confirm_password}
                onChange={set("confirm_password")}
                placeholder="Re-enter your new password"
                required
                className={`w-full px-3.5 py-2.5 rounded-lg bg-[hsl(var(--surface-raised))] border text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all ${
                  form.confirm_password && form.confirm_password !== form.new_password
                    ? "border-red-500/60 focus:ring-red-500/40"
                    : "border-[hsl(var(--border))] focus:border-blue-500/60"
                }`}
              />
              {form.confirm_password && form.confirm_password !== form.new_password && (
                <p className="text-xs text-red-400">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !form.current_password || !form.new_password || !form.confirm_password}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Changing password..." : "Set New Password"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[hsl(var(--muted-foreground))] mt-4">
          Signed in as <span className="text-[hsl(var(--foreground))]">{user.email}</span>
        </p>
      </motion.div>
    </div>
  );
}