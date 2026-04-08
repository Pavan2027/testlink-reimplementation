"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { testCasesApi, executionsApi, defectsApi, projectsApi, testPlansApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { DefectModal } from "@/components/modules/defects/DefectModal";
import { Play, CheckCircle2, XCircle, MinusCircle, ChevronRight, Clock, FileText } from "lucide-react";

type ResultStatus = "passed" | "failed" | "blocked";

export default function ExecutionPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [resultStatus, setResultStatus] = useState<ResultStatus | null>(null);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [defectModalOpen, setDefectModalOpen] = useState(false);
  const [lastExecution, setLastExecution] = useState<any>(null);
  const [filterProject, setFilterProject] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list().then(r => r.data),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["test-plans", filterProject],
    queryFn: () => testPlansApi.list(filterProject !== "all" ? filterProject : undefined).then(r => r.data),
  });

  const { data: testCases = [], isLoading } = useQuery({
    queryKey: ["test-cases", filterProject, filterPlan],
    queryFn: () => testCasesApi.list({
      project_id: filterProject !== "all" ? filterProject : undefined,
      test_plan_id: filterPlan !== "all" ? filterPlan : undefined,
      assigned_to: user?.role === "tester" ? user?.id : undefined,
    }).then(r => r.data),
  });

  const { data: executions = [] } = useQuery({
    queryKey: ["executions", selectedCase?.id],
    queryFn: () => executionsApi.list(selectedCase?.id).then(r => r.data),
    enabled: !!selectedCase?.id,
  });

  const executeMutation = useMutation({
    mutationFn: (data: any) => executionsApi.record(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["test-cases"] });
      qc.invalidateQueries({ queryKey: ["executions"] });
      qc.invalidateQueries({ queryKey: ["report-summary"] });
      setLastExecution(res.data);
      toast.success(`Test marked as ${resultStatus}`);
      if (resultStatus === "failed") {
        toast("Would you like to log a defect?", {
          action: { label: "Log Defect", onClick: () => setDefectModalOpen(true) },
          duration: 8000,
        });
      }
      setResultStatus(null);
      setComments("");
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Failed to record execution"),
  });

  const handleSubmit = async () => {
    if (!selectedCase || !resultStatus) {
      toast.error("Please select a result status");
      return;
    }
    setSubmitting(true);
    try {
      await executeMutation.mutateAsync({
        test_case_id: selectedCase.id,
        result_status: resultStatus,
        comments: comments || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const statusButtons: { status: ResultStatus; label: string; icon: any; color: string; activeColor: string }[] = [
    { status: "passed", label: "Pass", icon: CheckCircle2, color: "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10", activeColor: "bg-emerald-500/20 border-emerald-500 text-emerald-400" },
    { status: "failed", label: "Fail", icon: XCircle, color: "border-red-500/30 text-red-400 hover:bg-red-500/10", activeColor: "bg-red-500/20 border-red-500 text-red-400" },
    { status: "blocked", label: "Blocked", icon: MinusCircle, color: "border-amber-500/30 text-amber-400 hover:bg-amber-500/10", activeColor: "bg-amber-500/20 border-amber-500 text-amber-400" },
  ];

  const notRunCases = (testCases as any[]).filter(tc => tc.status === "not_run");
  const ranCases = (testCases as any[]).filter(tc => tc.status !== "not_run");

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 pb-0">
        <PageHeader title="Test Execution" description="Execute test cases and record results" />

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <select value={filterProject} onChange={e => { setFilterProject(e.target.value); setFilterPlan("all"); setSelectedCase(null); }}
            className="px-3 py-1.5 rounded-lg bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))] text-sm focus:outline-none">
            <option value="all">All Projects</option>
            {(projects as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterPlan} onChange={e => { setFilterPlan(e.target.value); setSelectedCase(null); }}
            className="px-3 py-1.5 rounded-lg bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))] text-sm focus:outline-none">
            <option value="all">All Plans</option>
            {(plans as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* Split panel */}
      <div className="flex-1 flex gap-0 overflow-hidden px-6 pb-6 gap-4 min-h-0">
        {/* Left: Test case list */}
        <div className="w-72 flex-shrink-0 flex flex-col card overflow-hidden">
          <div className="p-3 border-b border-[hsl(var(--border))]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              Assigned Cases ({testCases.length})
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 space-y-2">
                {Array(5).fill(0).map((_, i) => <div key={i} className="h-12 rounded-lg bg-[hsl(var(--surface-raised))] animate-pulse" />)}
              </div>
            ) : testCases.length === 0 ? (
              <EmptyState icon={Play} title="No test cases" description="No test cases match the current filters" />
            ) : (
              <div className="p-2 space-y-1">
                {/* Not run section */}
                {notRunCases.length > 0 && (
                  <>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] px-2 pt-1 pb-0.5">
                      Pending ({notRunCases.length})
                    </p>
                    {notRunCases.map((tc: any) => (
                      <TestCaseListItem key={tc.id} tc={tc} selected={selectedCase?.id === tc.id} onClick={() => { setSelectedCase(tc); setResultStatus(null); setComments(""); }} />
                    ))}
                  </>
                )}
                {/* Already run */}
                {ranCases.length > 0 && (
                  <>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] px-2 pt-3 pb-0.5">
                      Completed ({ranCases.length})
                    </p>
                    {ranCases.map((tc: any) => (
                      <TestCaseListItem key={tc.id} tc={tc} selected={selectedCase?.id === tc.id} onClick={() => { setSelectedCase(tc); setResultStatus(null); setComments(""); }} />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Execution panel */}
        <div className="flex-1 flex flex-col card overflow-hidden">
          {!selectedCase ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--surface-raised))] flex items-center justify-center mx-auto mb-3">
                  <ChevronRight className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
                </div>
                <p className="text-sm font-medium">Select a test case</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Choose a test case from the left panel to begin</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {/* Test case header */}
              <div className="p-5 border-b border-[hsl(var(--border))]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-base">{selectedCase.title}</h2>
                    {selectedCase.description && (
                      <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{selectedCase.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Badge value={selectedCase.status} />
                    <Badge value={selectedCase.priority} />
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Preconditions */}
                {selectedCase.preconditions && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">Preconditions</h3>
                    <p className="text-sm bg-[hsl(var(--surface-raised))] rounded-lg p-3 border border-[hsl(var(--border))]">{selectedCase.preconditions}</p>
                  </div>
                )}

                {/* Test steps */}
                {selectedCase.test_steps?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">Test Steps</h3>
                    <div className="space-y-2">
                      {selectedCase.test_steps.map((step: any, i: number) => (
                        <motion.div key={i}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex gap-3 p-3 rounded-lg bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))]">
                          <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 text-xs font-semibold flex items-center justify-center shrink-0">
                            {step.step}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{step.action}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Expected: {step.expected}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expected result */}
                {selectedCase.expected_result && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2">Expected Result</h3>
                    <p className="text-sm bg-[hsl(var(--surface-raised))] rounded-lg p-3 border border-[hsl(var(--border))]">{selectedCase.expected_result}</p>
                  </div>
                )}

                {/* Record result */}
                <div className="border-t border-[hsl(var(--border))] pt-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-3">Record Result</h3>

                  {/* Status buttons */}
                  <div className="flex gap-3 mb-4">
                    {statusButtons.map(({ status, label, icon: Icon, color, activeColor }) => (
                      <button key={status} onClick={() => setResultStatus(status)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${resultStatus === status ? activeColor : `border-[hsl(var(--border))] ${color}`}`}>
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Comments */}
                  <textarea
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                    placeholder="Execution notes or observations (optional)"
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none mb-3"
                  />

                  <button
                    onClick={handleSubmit}
                    disabled={!resultStatus || submitting}
                    className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    Submit Result
                  </button>
                </div>

                {/* Execution history */}
                {(executions as any[]).length > 0 && (
                  <div className="border-t border-[hsl(var(--border))] pt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> Execution History
                    </h3>
                    <div className="space-y-2">
                      {(executions as any[]).slice(0, 5).map((ex: any) => (
                        <div key={ex.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))] text-xs">
                          <Badge value={ex.result_status} />
                          <span className="text-[hsl(var(--muted-foreground))]">{new Date(ex.executed_at).toLocaleString()}</span>
                          {ex.comments && <span className="text-[hsl(var(--muted-foreground))] truncate flex-1">{ex.comments}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Defect modal pre-populated from failed execution */}
      <DefectModal
        open={defectModalOpen}
        onClose={() => setDefectModalOpen(false)}
        executionRecord={lastExecution}
        testCase={selectedCase}
      />
    </div>
  );
}

function TestCaseListItem({ tc, selected, onClick }: { tc: any; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full text-left p-2.5 rounded-lg transition-all border ${selected
      ? "bg-blue-600/15 border-blue-500/40 text-blue-400"
      : "border-transparent hover:bg-[hsl(var(--surface-raised))] text-[hsl(var(--foreground))]"}`}>
      <div className="flex items-center gap-2 mb-1">
        <Badge value={tc.status} />
        <Badge value={tc.priority} />
      </div>
      <p className="text-xs font-medium line-clamp-2">{tc.title}</p>
    </button>
  );
}