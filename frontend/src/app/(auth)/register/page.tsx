"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { TestTube2, Loader2, Building2 } from "lucide-react";

export default function RegisterPage() {
  const { refresh } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    org_name: "",
    org_slug: "",
    admin_full_name: "",
    admin_email: "",
    admin_password: "",
  });

  const handleOrgName = (val: string) => {
    setForm(f => ({
      ...f,
      org_name: val,
      org_slug: val.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.register(form);
      await refresh();
      toast.success("Workspace created! Welcome to TestLink.");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form, label: string, type = "text", placeholder = "") => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => key === "org_name" ? handleOrgName(e.target.value) : setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        required
        className="w-full px-3.5 py-2.5 rounded-lg bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <TestTube2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">TestLink</span>
          </div>
          <p className="text-[hsl(var(--muted-foreground))] text-sm">Create your organization workspace</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Org section */}
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Organization</span>
            </div>

            {field("org_name", "Organization Name", "text", "Acme Corp")}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Workspace URL</label>
              <div className="flex items-center gap-0">
                <span className="px-3 py-2.5 bg-[hsl(var(--muted))] border border-r-0 border-[hsl(var(--border))] rounded-l-lg text-sm text-[hsl(var(--muted-foreground))]">
                  testlink.app/
                </span>
                <input
                  value={form.org_slug}
                  onChange={e => setForm(f => ({ ...f, org_slug: e.target.value }))}
                  placeholder="acme-corp"
                  required
                  className="flex-1 px-3.5 py-2.5 rounded-r-lg bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all"
                />
              </div>
            </div>

            <div className="border-t border-[hsl(var(--border))] my-4" />

            {/* Admin section */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Admin Account</span>
            </div>

            {field("admin_full_name", "Full Name", "text", "Jane Smith")}
            {field("admin_email", "Email", "email", "jane@acme.com")}
            {field("admin_password", "Password", "password", "••••••••")}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Creating workspace..." : "Create Workspace"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-6">
          Already have a workspace?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}