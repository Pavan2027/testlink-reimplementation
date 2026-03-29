"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { testPlansApi, projectsApi } from "@/lib/api";
import { useAuth, canManageProjects } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TestPlanModal } from "@/components/modules/test-plans/TestPlanModal";
import { ClipboardList, Plus, Pencil, FolderKanban } from "lucide-react";

export default function TestPlansPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<string>("all");

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list().then(r => r.data),
  });

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["test-plans", selectedProject],
    queryFn: () => testPlansApi.list(selectedProject === "all" ? undefined : selectedProject).then(r => r.data),
  });

  const canManage = canManageProjects(user?.role ?? "tester");

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (p: any) => { setEditing(p); setModalOpen(true); };

  const getProjectName = (id: string) => projects.find((p: any) => p.id === id)?.name ?? "Unknown Project";

  const statusColor: Record<string, string> = {
    active: "border-l-emerald-500",
    draft: "border-l-zinc-500",
    closed: "border-l-purple-500",
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Test Plans"
        description="Organize test cases into structured plans"
        count={plans.length}
        action={canManage && (
          <button onClick={openCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> New Plan
          </button>
        )}
      />

      {/* Project filter */}
      {projects.length > 0 && (
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium">Filter by project:</span>
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setSelectedProject("all")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors
                ${selectedProject === "all" ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}>
              All
            </button>
            {projects.map((p: any) => (
              <button key={p.id} onClick={() => setSelectedProject(p.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors
                  ${selectedProject === p.id ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="card h-20 animate-pulse bg-[hsl(var(--surface-raised))]" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No test plans yet"
          description={projects.length === 0 ? "Create a project first, then add test plans" : "Create a test plan to start organizing your test cases"}
          action={canManage && projects.length > 0 && (
            <button onClick={openCreate} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> New Plan
            </button>
          )}
        />
      ) : (
        <div className="space-y-3">
          {plans.map((plan: any, i: number) => (
            <motion.div key={plan.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`card p-4 border-l-4 ${statusColor[plan.status] ?? "border-l-zinc-500"} hover:border-blue-500/30 transition-colors group`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1">
                    <h3 className="font-medium">{plan.name}</h3>
                    <Badge value={plan.status} />
                  </div>
                  {plan.description && (
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2 line-clamp-1">{plan.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
                    <FolderKanban className="w-3 h-3" />
                    <span>{getProjectName(plan.project_id)}</span>
                    <span className="mx-1">·</span>
                    <span>Created {new Date(plan.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {canManage && (
                  <button onClick={() => openEdit(plan)}
                    className="p-1.5 rounded-md hover:bg-[hsl(var(--surface-overlay))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors opacity-0 group-hover:opacity-100">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <TestPlanModal open={modalOpen} onClose={() => setModalOpen(false)} plan={editing}
        defaultProjectId={selectedProject !== "all" ? selectedProject : undefined} />
    </div>
  );
}