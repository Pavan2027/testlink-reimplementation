"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  TestTube2, Sparkles, Shield, BarChart3, MessageSquare,
  ChevronRight, Play, Bug, Users, FolderKanban, CheckCircle,
  Zap, Lock, Globe,
} from "lucide-react";

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = to / 40;
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setCount(to); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 30);
    return () => clearInterval(timer);
  }, [inView, to]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      className="group relative p-6 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15 transition-all duration-300"
    >
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role, color, items }: { role: string; color: string; items: string[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="p-5 rounded-2xl border border-white/8 bg-white/3"
    >
      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${color} mb-4`}>
        {role}
      </span>
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item} className="flex items-center gap-2 text-sm text-white/60">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050810] text-white overflow-x-hidden">

      {/* Grid background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px]" />

      {/* Glow orbs */}
      <div className="fixed top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="fixed top-[30%] right-[-10%] w-[400px] h-[400px] rounded-full bg-purple-600/8 blur-[100px] pointer-events-none" />

      {/* ── Nav ── */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <TestTube2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight">TestLink</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login"
            className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/register"
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative z-10 pt-24 pb-32 px-8 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          AI-powered test management
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Test smarter,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
            ship faster
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          TestLink is a modern test management platform built for software teams.
          Manage projects, execute test cases, track defects, and generate insights —
          all powered by AI.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center justify-center gap-3 flex-wrap"
        >
          <Link href="/register"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all hover:scale-105 shadow-lg shadow-blue-600/20">
            Create free workspace
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link href="/login"
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 hover:border-white/20 text-white/80 hover:text-white font-medium transition-all hover:bg-white/5">
            Sign in
          </Link>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-12 mt-20 flex-wrap"
        >
          {[
            { to: 4, suffix: " roles", label: "Access levels" },
            { to: 4, suffix: " AI features", label: "Built-in" },
            { to: 100, suffix: "%", label: "Offline capable" },
          ].map(({ to, suffix, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-bold text-white tabular-nums">
                <Counter to={to} suffix={suffix} />
              </p>
              <p className="text-sm text-white/40 mt-1">{label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 py-24 px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">Features</p>
          <h2 className="text-3xl md:text-4xl font-bold">Everything your team needs</h2>
          <p className="text-white/50 mt-3 max-w-xl mx-auto">
            From test case creation to defect resolution — the entire QA lifecycle in one place.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FeatureCard delay={0} icon={FolderKanban} color="bg-blue-600"
            title="Project Management"
            desc="Organize testing activities into projects with timelines, status tracking, and team assignment." />
          <FeatureCard delay={0.05} icon={TestTube2} color="bg-violet-600"
            title="Test Case Management"
            desc="Create structured test cases with steps, preconditions, and expected results. Import from AI in seconds." />
          <FeatureCard delay={0.1} icon={Play} color="bg-emerald-600"
            title="Test Execution Console"
            desc="Split-panel execution interface. Walk through steps, record pass/fail/blocked, and log defects inline." />
          <FeatureCard delay={0.15} icon={Bug} color="bg-red-600"
            title="Defect Tracking"
            desc="Full defect lifecycle management — open, in progress, resolved, closed — with developer assignment." />
          <FeatureCard delay={0.2} icon={BarChart3} color="bg-amber-600"
            title="Reports & Metrics"
            desc="Visual dashboards with pass rate charts, defect severity breakdowns, and execution history." />
          <FeatureCard delay={0.25} icon={Shield} color="bg-cyan-600"
            title="Role-Based Access"
            desc="Admin, Manager, Tester, Developer — each role sees exactly what they need, nothing more." />
        </div>
      </section>

      {/* ── AI Features ── */}
      <section className="relative z-10 py-24 px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-10 md:p-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" /> AI Features
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Intelligence built in</h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Four AI features, all optional. They accelerate your workflow without getting in the way.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: TestTube2, title: "Test Case Generation", desc: "Describe a feature in plain English. Get a fully structured test case with steps, preconditions, and expected results — ready to edit and save." },
              { icon: Bug, title: "Defect Root Cause Analysis", desc: "On failed executions, AI analyzes the test steps and comments to suggest the most likely root cause and fix direction." },
              { icon: BarChart3, title: "Report Insights", desc: "After viewing metrics, generate a natural language summary of coverage gaps, risk areas, and actionable recommendations." },
              { icon: MessageSquare, title: "Natural Language Chat", desc: 'Ask questions like "show me all failed tests this week" or "how many open critical defects?" and get instant answers.' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div key={title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -10 : 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex gap-4 p-5 rounded-2xl bg-white/3 border border-white/6 hover:bg-white/5 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-600/30 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-purple-300" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section className="relative z-10 py-24 px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-3">Access Control</p>
          <h2 className="text-3xl md:text-4xl font-bold">Built for every team member</h2>
          <p className="text-white/50 mt-3 max-w-xl mx-auto">
            Role-based access ensures each person sees exactly what they need.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <RoleBadge role="Admin" color="bg-purple-500/20 text-purple-300"
            items={["Full system access", "User management", "All modules", "Organization settings"]} />
          <RoleBadge role="Manager" color="bg-blue-500/20 text-blue-300"
            items={["Project creation", "Test plan management", "Execution oversight", "Reports & metrics"]} />
          <RoleBadge role="Tester" color="bg-emerald-500/20 text-emerald-300"
            items={["Create test cases", "Execute tests", "Log defects", "AI test generation"]} />
          <RoleBadge role="Developer" color="bg-amber-500/20 text-amber-300"
            items={["View test cases", "Update defect status", "AI root cause analysis", "Track resolution"]} />
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-24 px-8 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-12 rounded-3xl border border-blue-500/20 bg-blue-500/5"
        >
          <div className="flex items-center justify-center gap-3 mb-4 flex-wrap text-sm text-white/40">
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-blue-400" /> Fast setup</span>
            <span className="text-white/20">·</span>
            <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-blue-400" /> Secure by default</span>
            <span className="text-white/20">·</span>
            <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-blue-400" /> Works offline</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-white/50 mb-8 max-w-md mx-auto">
            Create your organization workspace in under a minute. No credit card required.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/register"
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all hover:scale-105 shadow-lg shadow-blue-600/25">
              Create free workspace
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link href="/login"
              className="px-7 py-3.5 rounded-xl border border-white/10 hover:border-white/20 text-white/70 hover:text-white font-medium transition-all">
              Sign in
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/6 py-8 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <TestTube2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium">TestLink</span>
          </div>
          <p className="text-xs text-white/30">
            Built for BCSE301P — Software Engineering · VIT Vellore
          </p>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <Link href="/login" className="hover:text-white/60 transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-white/60 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}