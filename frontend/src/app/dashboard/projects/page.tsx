"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { projectsApi } from "@/lib/api";
import { useAuth, canManageProjects } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProjectModal } from "@/components/modules/projects/ProjectModal";
import { FolderKanban, Plus, Pencil, Trash2, Calendar, Archive } from "lucide-react";

export default function ProjectsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filter, setFilter] = useState<string>("all");

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list().then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); toast.success("Project deleted"); },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Failed to delete"),
  });

  const archiveMutation = useMutation({
    mutationFn: (p: any) => projectsApi.update(p.id, { status: p.status === "archived" ? "active" : "archived" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["projects"] }); toast.success("Project updated"); },
  });

  const canManage = canManageProjects(user?.role ?? "tester");
  const filtered = filter === "all" ? projects : projects.filter((p: any) => p.status === filter);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (p: any) => { setEditing(p); setModalOpen(true); };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Projects"
        description="Manage your test projects"
        count={projects.length}
        action={canManage && (
          <button onClick={openCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> New Project
          </button>
        )}
      />

      {/* Filter tabs */}
      <div className="flex flex-row gap-1 mb-5 p-1 rounded-lg bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))] w-fit">
        {["all", "active", "completed", "archived"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize whitespace-nowrap
              ${filter === f
                ? "bg-[hsl(var(--surface-overlay))] text-[hsl(var(--foreground))] shadow-sm"
                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}>
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="card h-36 animate-pulse bg-[hsl(var(--surface-raised))]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects found"
          description={filter === "all" ? "Create your first project to get started" : `No ${filter} projects`}
          action={canManage && filter === "all" && (
            <button onClick={openCreate} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> New Project
            </button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p: any, i: number) => (
            <motion.div key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card p-5 hover:border-blue-500/30 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 mr-2">
                  <h3 className="font-medium truncate">{p.name}</h3>
                  {p.description && (
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5 line-clamp-2">{p.description}</p>
                  )}
                </div>
                <Badge value={p.status} />
              </div>

              {(p.start_date || p.end_date) && (
                <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))] mb-3">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(p.start_date)} {p.start_date && p.end_date && "→"} {formatDate(p.end_date)}</span>
                </div>
              )}

              <div className="flex items-center justify-between mt-auto pt-3 border-t border-[hsl(var(--border))]">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  Created {new Date(p.created_at).toLocaleDateString()}
                </span>
                {canManage && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(p)}
                      className="p-1.5 rounded-md hover:bg-[hsl(var(--surface-overlay))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => archiveMutation.mutate(p)}
                      className="p-1.5 rounded-md hover:bg-[hsl(var(--surface-overlay))] text-[hsl(var(--muted-foreground))] hover:text-amber-400 transition-colors">
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => {
                      if (confirm(`Delete "${p.name}"? This cannot be undone.`)) deleteMutation.mutate(p.id);
                    }}
                      className="p-1.5 rounded-md hover:bg-red-500/10 text-[hsl(var(--muted-foreground))] hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ProjectModal open={modalOpen} onClose={() => setModalOpen(false)} project={editing} />
    </div>
  );
}