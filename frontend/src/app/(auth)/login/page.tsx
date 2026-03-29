"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Eye, EyeOff, TestTube2, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center p-4">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2.5 mb-3"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <TestTube2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">TestLink</span>
          </motion.div>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full px-3.5 py-2.5 rounded-lg bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-6">
          New organization?{" "}
          <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Create workspace
          </Link>
        </p>
      </motion.div>
    </div>
  );
}