"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { reportsApi, projectsApi } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Sparkles, Loader2 } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  passed: "#10b981",
  failed: "#ef4444",
  blocked: "#f59e0b",
  not_run: "#71717a",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#ca8a04",
  low: "#2563eb",
};

const DEFECT_STATUS_COLORS: Record<string, string> = {
  open: "#ef4444",
  in_progress: "#3b82f6",
  resolved: "#10b981",
  closed: "#71717a",
};

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-sm font-medium mt-0.5">{label}</p>
      {sub && <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const [selectedProject, setSelectedProject] = useState("all");
  const [showInsights, setShowInsights] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list().then(r => r.data),
  });

  const { data: report, isLoading } = useQuery({
    queryKey: ["report-summary", selectedProject],
    queryFn: () => reportsApi.summary(selectedProject !== "all" ? selectedProject : undefined).then(r => r.data),
  });

  const handleGenerateInsights = async () => {
    setLoadingInsights(true);
    try {
      const res = await reportsApi.aiInsights(selectedProject !== "all" ? selectedProject : undefined);
      setInsights(res.data);
      setShowInsights(true);
      toast.success("AI insights generated");
    } catch {
      toast.error("Failed to generate insights. Check your AI_API_KEY in .env");
    } finally {
      setLoadingInsights(false);
    }
  };

  const byStatusData = report
    ? Object.entries(report.by_status)
        .map(([name, value]) => ({ name: name.replace("_", " "), value: value as number, fill: STATUS_COLORS[name] ?? "#71717a" }))
        .filter(d => d.value > 0)
    : [];

  const bySeverityData = report
    ? Object.entries(report.defects_by_severity)
        .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value: value as number, fill: SEVERITY_COLORS[name] ?? "#71717a" }))
    : [];

  const passRate = report && report.total_test_cases > 0
    ? Math.round((report.by_status.passed / report.total_test_cases) * 100)
    : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Reports"
        description="Test execution metrics and quality insights"
        action={
          <div className="flex items-center gap-2">
            <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))] text-sm focus:outline-none">
              <option value="all">All Projects</option>
              {(projects as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={handleGenerateInsights} disabled={loadingInsights}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-sm font-medium transition-colors disabled:opacity-60">
              {loadingInsights ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              AI Insights
            </button>
          </div>
        }
      />

      {/* AI Insights panel */}
      <AnimatePresence>
        {showInsights && insights && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="mb-5 p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 ai-glow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-purple-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">AI Insights</span>
              </div>
              <button onClick={() => setShowInsights(false)} className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                Dismiss
              </button>
            </div>
            {insights.summary && <p className="text-sm mb-3">{insights.summary}</p>}
            {insights.insights?.length > 0 && (
              <ul className="space-y-1.5 mb-3">
                {insights.insights.map((ins: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-purple-400 shrink-0">•</span><span>{ins}</span>
                  </li>
                ))}
              </ul>
            )}
            {insights.recommendations?.length > 0 && (
              <div className="pt-3 border-t border-purple-500/20">
                <p className="text-xs font-semibold text-purple-400 mb-2">Recommendations</p>
                <ul className="space-y-1">
                  {insights.recommendations.map((r: string, i: number) => (
                    <li key={i} className="text-sm text-[hsl(var(--muted-foreground))] flex gap-2">
                      <span className="text-purple-400 shrink-0">→</span>{r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {Array(4).fill(0).map((_, i) => <div key={i} className="card h-20 animate-pulse bg-[hsl(var(--surface-raised))]" />)}
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
            <StatCard label="Total Test Cases" value={report?.total_test_cases ?? 0} />
            <StatCard label="Pass Rate" value={passRate} sub="percent" />
            <StatCard label="Total Executions" value={report?.total_executions ?? 0} />
            <StatCard label="Open Defects" value={report?.defects_by_status?.open ?? 0} />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4">Test Case Status</h3>
              {byStatusData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-[hsl(var(--muted-foreground))]">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={byStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      {byStatusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--surface-overlay))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4">Defects by Severity</h3>
              {bySeverityData.every(d => d.value === 0) ? (
                <div className="flex items-center justify-center h-48 text-sm text-[hsl(var(--muted-foreground))]">No defects logged</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={bySeverityData} barSize={36}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--surface-overlay))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {bySeverityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Defect lifecycle */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-4">Defect Lifecycle</h3>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(report?.defects_by_status ?? {}).map(([status, count]: any) => (
                <div key={status} className="text-center p-3 rounded-lg bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))]">
                  <p className="text-xl font-bold tabular-nums">{count}</p>
                  <span className={`text-xs mt-1 capitalize badge-${status} inline-flex px-2 py-0.5 rounded-full`}>
                    {status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}