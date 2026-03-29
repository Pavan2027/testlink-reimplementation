"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { testCasesApi, projectsApi, testPlansApi } from "@/lib/api";
import { useAuth, canCreateTestCases } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TestCaseModal } from "@/components/modules/test-cases/TestCaseModal";
import { AIGenerateModal } from "@/components/modules/test-cases/AIGenerateModal";
import { TestTube2, Plus, Sparkles, Pencil, Trash2, ChevronDown, ChevronUp, Cpu } from "lucide-react";

export default function TestCasesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [prefilled, setPrefilled] = useState<any>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: () => projectsApi.list().then(r => r.data) });
  const { data: plans = [] } = useQuery({
    queryKey: ["test-plans", filterProject],
    queryFn: () => testPlansApi.list(filterProject === "all" ? undefined : filterProject).then(r => r.data),
  });
  const { data: testCases = [], isLoading } = useQuery({
    queryKey: ["test-cases", filterProject, filterPlan, filterStatus],
    queryFn: () => testCasesApi.list({
      project_id: filterProject !== "all" ? filterProject : undefined,
      test_plan_id: filterPlan !== "all" ? filterPlan : undefined,
    }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => testCasesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["test-cases"] }); toast.success("Test case deleted"); },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Failed to delete"),
  });

  const canCreate = canCreateTestCases(user?.role ?? "tester");

  const filtered = filterStatus === "all" ? testCases : testCases.filter((tc: any) => tc.status === filterStatus);

  const openCreate = () => { setEditing(null); setPrefilled(null); setModalOpen(true); };
  const openEdit = (tc: any) => { setEditing(tc); setPrefilled(null); setModalOpen(true); };
  const openAI = () => setAiModalOpen(true);

  const handleAIAccept = (generated: any) => {
    setPrefilled(generated);
    setEditing(null);
    setModalOpen(true);
  };

  const getProjectName = (id: string) => (projects as any[]).find(p => p.id === id)?.name ?? "";
  const getPlanName = (id: string) => (plans as any[]).find(p => p.id === id)?.name ?? "";

  const priorityOrder = ["critical", "high", "medium", "low"];
  const sorted = [...filtered].sort((a: any, b: any) =>
    priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
  );

  const statusOptions = ["all", "not_run", "passed", "failed", "blocked"];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="Test Cases"
        description="Define and manage your test scenarios"
        count={filtered.length}
        action={canCreate && (
          <div className="flex items-center gap-2">
            <button onClick={openAI}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-sm font-medium transition-colors">
              <Sparkles className="w-4 h-4" /> AI Generate
            </button>
            <button onClick={openCreate}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> New Test Case
            </button>
          </div>
        )}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Project filter */}
        <select value={filterProject} onChange={e => { setFilterProject(e.target.value); setFilterPlan("all"); }}
          className="px-3 py-1.5 rounded-lg bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/40">
          <option value="all">All Projects</option>
          {(projects as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {/* Plan filter */}
        <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/40">
          <option value="all">All Plans</option>
          {(plans as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        {/* Status filter tabs */}
        <div className="flex flex-row gap-1 p-1 rounded-lg bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))]">
          {statusOptions.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all whitespace-nowrap capitalize
                ${filterStatus === s
                  ? "bg-[hsl(var(--surface-overlay))] text-[hsl(var(--foreground))] shadow-sm"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"}`}>
              {s === "not_run" ? "Not Run" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array(5).fill(0).map((_, i) => <div key={i} className="card h-14 animate-pulse bg-[hsl(var(--surface-raised))]" />)}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState icon={TestTube2} title="No test cases found"
          description="Create test cases manually or use AI to generate them from a feature description"
          action={canCreate && (
            <div className="flex gap-2">
              <button onClick={openAI} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-400 text-sm font-medium transition-colors">
                <Sparkles className="w-4 h-4" /> AI Generate
              </button>
              <button onClick={openCreate} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> Manual
              </button>
            </div>
          )}
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {sorted.map((tc: any, i: number) => (
              <motion.div key={tc.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ delay: i * 0.04 }}
                className="card overflow-hidden group">
                {/* Header row */}
                <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[hsl(var(--surface-raised))] transition-colors"
                  onClick={() => setExpanded(expanded === tc.id ? null : tc.id)}>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Badge value={tc.status} />
                    <Badge value={tc.priority} />
                    <span className="text-sm font-medium truncate">{tc.title}</span>
                    {tc.ai_generated && (
                      <span title="AI generated" className="text-purple-400 shrink-0">
                        <Cpu className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-[hsl(var(--muted-foreground))] hidden md:block">
                      {getProjectName(tc.project_id)}
                    </span>
                    {canCreate && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={e => { e.stopPropagation(); openEdit(tc); }}
                          className="p-1 rounded hover:bg-[hsl(var(--surface-overlay))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); if (confirm("Delete this test case?")) deleteMutation.mutate(tc.id); }}
                          className="p-1 rounded hover:bg-red-500/10 text-[hsl(var(--muted-foreground))] hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    {expanded === tc.id ? <ChevronUp className="w-4 h-4 text-[hsl(var(--muted-foreground))]" /> : <ChevronDown className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />}
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {expanded === tc.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-[hsl(var(--border))]">
                      <div className="p-4 space-y-3 text-sm bg-[hsl(var(--surface-raised))]">
                        {tc.preconditions && (
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Preconditions</span>
                            <p className="mt-1 text-[hsl(var(--muted-foreground))]">{tc.preconditions}</p>
                          </div>
                        )}
                        {tc.test_steps?.length > 0 && (
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Test Steps</span>
                            <ol className="mt-1 space-y-1">
                              {tc.test_steps.map((s: any, idx: number) => (
                                <li key={idx} className="flex gap-2">
                                  <span className="text-[hsl(var(--muted-foreground))] w-5 shrink-0">{s.step}.</span>
                                  <span>{s.action} <span className="text-[hsl(var(--muted-foreground))]">→ {s.expected}</span></span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                        {tc.expected_result && (
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Expected Result</span>
                            <p className="mt-1 text-[hsl(var(--muted-foreground))]">{tc.expected_result}</p>
                          </div>
                        )}
                        <div className="flex gap-4 pt-1 text-xs text-[hsl(var(--muted-foreground))]">
                          {tc.test_plan_id && <span>Plan: {getPlanName(tc.test_plan_id)}</span>}
                          <span>Created {new Date(tc.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <TestCaseModal open={modalOpen} onClose={() => { setModalOpen(false); setPrefilled(null); }}
        testCase={editing} prefilled={prefilled}
        defaultProjectId={filterProject !== "all" ? filterProject : undefined} />
      <AIGenerateModal open={aiModalOpen} onClose={() => setAiModalOpen(false)}
        onAccept={handleAIAccept}
        projectId={filterProject !== "all" ? filterProject : (projects[0] as any)?.id ?? ""}
        testPlanId={filterPlan !== "all" ? filterPlan : undefined} />
    </div>
  );
}