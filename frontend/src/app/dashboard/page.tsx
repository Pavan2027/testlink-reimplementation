"use client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { projectsApi, reportsApi, defectsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { FolderKanban, TestTube2, Play, Bug, TrendingUp, Clock } from "lucide-react";

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35 } }),
};

function MetricCard({ label, value, icon: Icon, color, index }: any) {
  return (
    <motion.div custom={index} variants={cardVariants} initial="hidden" animate="visible"
      className="card p-5 flex items-start gap-4 hover:border-blue-500/30 transition-colors">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums">{value ?? "—"}</p>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return <div className="card p-5 h-20 animate-pulse bg-[hsl(var(--surface-raised))]" />;
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list().then(r => r.data),
  });

  const { data: report, isLoading: loadingReport } = useQuery({
    queryKey: ["report-summary"],
    queryFn: () => reportsApi.summary().then(r => r.data),
  });

  const { data: defects, isLoading: loadingDefects } = useQuery({
    queryKey: ["defects", "open"],
    queryFn: () => defectsApi.list({ status: "open" }).then(r => r.data),
  });

  const activeProjects = projects?.filter((p: any) => p.status === "active").length ?? 0;

  const metrics = [
    { label: "Active Projects", value: activeProjects, icon: FolderKanban, color: "bg-blue-500/15 text-blue-400" },
    { label: "Total Test Cases", value: report?.total_test_cases, icon: TestTube2, color: "bg-purple-500/15 text-purple-400" },
    { label: "Total Executions", value: report?.total_executions, icon: Play, color: "bg-emerald-500/15 text-emerald-400" },
    { label: "Open Defects", value: defects?.length, icon: Bug, color: "bg-red-500/15 text-red-400" },
  ];

  const loading = loadingProjects || loadingReport || loadingDefects;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xl font-semibold">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},{" "}
          {user?.full_name.split(" ")[0]} 👋
        </motion.h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">Here's your workspace overview</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />) :
          metrics.map((m, i) => <MetricCard key={m.label} {...m} index={i} />)}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Projects overview */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <FolderKanban className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <h2 className="text-sm font-semibold">Active Projects</h2>
          </div>
          {loadingProjects ? (
            <div className="space-y-2">{Array(3).fill(0).map((_, i) => <div key={i} className="h-10 rounded-lg bg-[hsl(var(--surface-raised))] animate-pulse" />)}</div>
          ) : projects?.length === 0 ? (
            <div className="text-center py-8 text-[hsl(var(--muted-foreground))] text-sm">No projects yet</div>
          ) : (
            <div className="space-y-2">
              {projects?.filter((p: any) => p.status === "active").slice(0, 5).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[hsl(var(--surface-raised))] transition-colors">
                  <span className="text-sm font-medium">{p.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full badge-${p.status}`}>{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Test execution summary */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <h2 className="text-sm font-semibold">Execution Summary</h2>
          </div>
          {loadingReport ? (
            <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="h-6 rounded bg-[hsl(var(--surface-raised))] animate-pulse" />)}</div>
          ) : report ? (
            <div className="space-y-3">
              {Object.entries(report.by_status || {}).map(([status, count]: any) => (
                <div key={status} className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full badge-${status} w-20 text-center`}>{status.replace("_", " ")}</span>
                  <div className="flex-1 bg-[hsl(var(--surface-raised))] rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-700 ${
                        status === "passed" ? "bg-emerald-500" :
                        status === "failed" ? "bg-red-500" :
                        status === "blocked" ? "bg-amber-500" : "bg-zinc-500"}`}
                      style={{ width: `${report.total_test_cases ? (count / report.total_test_cases) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm tabular-nums text-[hsl(var(--muted-foreground))] w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-[hsl(var(--muted-foreground))]">No data yet</p>}
        </motion.div>
      </div>
    </div>
  );
}