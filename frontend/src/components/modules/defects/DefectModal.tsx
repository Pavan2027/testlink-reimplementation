"use client";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea, FormActions } from "@/components/ui/FormFields";
import { defectsApi, usersApi } from "@/lib/api";
import { Sparkles, Loader2, Lightbulb, X } from "lucide-react";

interface DefectModalProps {
  open: boolean;
  onClose: () => void;
  defect?: any;
  executionRecord?: any;
  testCase?: any;
}

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export function DefectModal({ open, onClose, defect, executionRecord, testCase }: DefectModalProps) {
  const qc = useQueryClient();
  const isEdit = !!defect;

  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "medium",
    priority: "medium",
    status: "open",
    assigned_to: "",
  });

  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list().then(r => r.data),
  });

  const developerOptions = [
    { value: "", label: "Unassigned" },
    ...(users as any[])
      .filter((u: any) => ["developer", "admin"].includes(u.role))
      .map((u: any) => ({ value: u.id, label: u.full_name })),
  ];

  useEffect(() => {
    if (!open) return;
    if (defect) {
      setForm({
        title: defect.title,
        description: defect.description || "",
        severity: defect.severity,
        priority: defect.priority,
        status: defect.status,
        assigned_to: defect.assigned_to || "",
      });
      if (defect.ai_root_cause) {
        setAiAnalysis({ root_cause: defect.ai_root_cause, fix_suggestion: defect.ai_fix_suggestion });
        setShowAI(true);
      }
    } else {
      // Pre-populate from failed execution
      setForm({
        title: testCase ? `[FAIL] ${testCase.title}` : "",
        description: executionRecord?.comments || "",
        severity: "medium",
        priority: "medium",
        status: "open",
        assigned_to: "",
      });
      setAiAnalysis(null);
      setShowAI(false);
    }
  }, [defect, executionRecord, testCase, open]);

  const set = (key: string) => (e: React.ChangeEvent<any>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEdit ? defectsApi.update(defect.id, data) : defectsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["defects"] });
      qc.invalidateQueries({ queryKey: ["report-summary"] });
      toast.success(isEdit ? "Defect updated" : "Defect logged");
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Something went wrong"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      assigned_to: form.assigned_to || null,
      execution_record_id: executionRecord?.id || defect?.execution_record_id || null,
      test_case_id: testCase?.id || defect?.test_case_id || null,
    });
  };

  const handleAIAnalyze = async () => {
    if (!defect?.id) {
      toast.error("Save the defect first, then run AI analysis");
      return;
    }
    setAnalyzing(true);
    try {
      const res = await defectsApi.aiAnalyze(defect.id);
      setAiAnalysis(res.data);
      setShowAI(true);
      toast.success("AI analysis complete");
    } catch {
      toast.error("AI analysis failed. Check your AI_API_KEY in .env");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? "Edit Defect" : "Log Defect"}
      description={!isEdit && testCase ? `Linked to: ${testCase.title}` : undefined}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title *" value={form.title} onChange={set("title")} placeholder="Brief description of the defect" required />
        <Textarea label="Description" value={form.description} onChange={set("description")} placeholder="Steps to reproduce, actual vs expected behaviour..." rows={3} />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Severity" value={form.severity} onChange={set("severity")} options={SEVERITY_OPTIONS} />
          <Select label="Priority" value={form.priority} onChange={set("priority")} options={SEVERITY_OPTIONS} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {isEdit && <Select label="Status" value={form.status} onChange={set("status")} options={STATUS_OPTIONS} />}
          <Select label="Assign To (Developer)" value={form.assigned_to} onChange={set("assigned_to")} options={developerOptions} />
        </div>

        {/* AI Analysis — only shown on existing defects or after analysis */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">AI Root Cause Analysis</span>
            {isEdit && (
              <button type="button" onClick={handleAIAnalyze} disabled={analyzing}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors disabled:opacity-60">
                {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                {analyzing ? "Analyzing..." : "Analyze with AI"}
              </button>
            )}
          </div>

          <AnimatePresence>
            {showAI && aiAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="relative p-4 rounded-lg border border-purple-500/20 bg-purple-500/5 ai-glow space-y-3">
                <button type="button" onClick={() => setShowAI(false)}
                  className="absolute top-3 right-3 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-2 text-purple-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">AI Analysis</span>
                </div>
                {aiAnalysis.root_cause && (
                  <div>
                    <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1">Root Cause</p>
                    <p className="text-sm">{aiAnalysis.root_cause}</p>
                  </div>
                )}
                {aiAnalysis.fix_suggestion && (
                  <div className="flex gap-2 p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <Lightbulb className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-purple-400 mb-0.5">Suggested Fix</p>
                      <p className="text-sm">{aiAnalysis.fix_suggestion}</p>
                    </div>
                  </div>
                )}
                {aiAnalysis.fix_category && (
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    Category: <span className="text-[hsl(var(--foreground))]">{aiAnalysis.fix_category}</span>
                    {aiAnalysis.confidence && <> · Confidence: <span className="text-[hsl(var(--foreground))]">{aiAnalysis.confidence}</span></>}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!showAI && !isEdit && (
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Save this defect first, then use "Analyze with AI" to get root cause suggestions.
            </p>
          )}
        </div>

        <FormActions onCancel={onClose} loading={mutation.isPending} submitLabel={isEdit ? "Save Changes" : "Log Defect"} />
      </form>
    </Modal>
  );
}