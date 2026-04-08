"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { defectsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DefectModal } from "@/components/modules/defects/DefectModal";
import { Bug, Plus, Pencil, ChevronDown, ChevronUp, Clock } from "lucide-react";

const STATUS_FLOW = ["open", "in_progress", "resolved", "closed"];

export default function DefectsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");

  const { data: defects = [], isLoading } = useQuery({
    queryKey: ["defects", filterStatus, filterSeverity],
    queryFn: () => defectsApi.list({
      status: filterStatus !== "all" ? filterStatus : undefined,
      severity: filterSeverity !== "all" ? filterSeverity : undefined,
    }).then(r => r.data),
  });

  const quickStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      defectsApi.update(id, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["defects"] }); toast.success("Status updated"); },
    onError: () => toast.error("Failed to update status"),
  });

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (d: any) => { setEditing(d); setModalOpen(true); };

  const canChangeStatus = ["admin", "developer", "manager"].includes(user?.role ?? "");

  const statusFilters = ["all", "open", "in_progress", "resolved", "closed"];
  const severityFilters = ["all", "critical", "high", "medium", "low"];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Defects"
        description="Track and resolve defects found during testing"
        count={defects.length}
        action={
          <button onClick={openCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Log Defect
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Status tabs */}
        <div className="flex flex-row gap-1 p-1 rounded-lg bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))]">
          {statusFilters.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap capitalize
                ${filterStatus === s ? "bg-[hsl(var(--surface-overlay))] text-[hsl(var(--foreground))] shadow-sm" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}>
              {s.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Severity filter */}
        <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))] text-sm focus:outline-none">
          {severityFilters.map(s => (
            <option key={s} value={s}>{s === "all" ? "All Severities" : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array(5).fill(0).map((_, i) => <div key={i} className="card h-16 animate-pulse bg-[hsl(var(--surface-raised))]" />)}
        </div>
      ) : defects.length === 0 ? (
        <EmptyState icon={Bug} title="No defects found"
          description={filterStatus === "all" ? "No defects logged yet — they appear here when test cases fail" : `No ${filterStatus.replace("_", " ")} defects`}
        />
      ) : (
        <div className="space-y-2">
          {(defects as any[]).map((d: any, i: number) => (
            <motion.div key={d.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card overflow-hidden group">
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[hsl(var(--surface-raised))] transition-colors"
                onClick={() => setExpanded(expanded === d.id ? null : d.id)}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge value={d.status} />
                  <Badge value={d.severity} />
                  <span className="text-sm font-medium truncate">{d.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {/* Quick status advance */}
                  {canChangeStatus && d.status !== "closed" && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        const next = STATUS_FLOW[STATUS_FLOW.indexOf(d.status) + 1];
                        if (next) quickStatusMutation.mutate({ id: d.id, status: next });
                      }}
                      className="text-xs px-2 py-1 rounded border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-blue-500/40 transition-colors opacity-0 group-hover:opacity-100">
                      → {STATUS_FLOW[STATUS_FLOW.indexOf(d.status) + 1]?.replace("_", " ")}
                    </button>
                  )}
                  <button onClick={e => { e.stopPropagation(); openEdit(d); }}
                    className="p-1.5 rounded-md hover:bg-[hsl(var(--surface-overlay))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors opacity-0 group-hover:opacity-100">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  {expanded === d.id ? <ChevronUp className="w-4 h-4 text-[hsl(var(--muted-foreground))]" /> : <ChevronDown className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />}
                </div>
              </div>

              {/* Expanded */}
              {expanded === d.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-[hsl(var(--border))] bg-[hsl(var(--surface-raised))]">
                  <div className="p-4 space-y-3 text-sm">
                    {d.description && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-1">Description</p>
                        <p>{d.description}</p>
                      </div>
                    )}
                    {/* AI analysis if present */}
                    {d.ai_root_cause && (
                      <div className="p-3 rounded-lg border border-purple-500/20 bg-purple-500/5 space-y-2">
                        <p className="text-xs font-semibold text-purple-400">🤖 AI Root Cause</p>
                        <p className="text-sm">{d.ai_root_cause}</p>
                        {d.ai_fix_suggestion && (
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            Fix: <span className="text-[hsl(var(--foreground))]">{d.ai_fix_suggestion}</span>
                          </p>
                        )}
                      </div>
                    )}
                    <div className="flex gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Logged {new Date(d.created_at).toLocaleDateString()}</span>
                      {d.resolved_at && <span>Resolved {new Date(d.resolved_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <DefectModal open={modalOpen} onClose={() => setModalOpen(false)} defect={editing} />
    </div>
  );
}