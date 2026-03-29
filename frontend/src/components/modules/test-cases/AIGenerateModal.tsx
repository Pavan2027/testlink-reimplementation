"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { testCasesApi } from "@/lib/api";
import { Sparkles, Loader2, ChevronRight, RefreshCw } from "lucide-react";

interface AIGenerateModalProps {
  open: boolean;
  onClose: () => void;
  onAccept: (generated: any) => void;
  projectId: string;
  testPlanId?: string;
}

export function AIGenerateModal({ open, onClose, onAccept, projectId, testPlanId }: AIGenerateModalProps) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const generate = async () => {
    if (!description.trim()) { toast.error("Please describe the feature to test"); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await testCasesApi.aiGenerate({
        feature_description: description,
        project_id: projectId,
        test_plan_id: testPlanId || null,
      });
      setResult(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "AI generation failed. Check your AI_API_KEY.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (!result) return;
    onAccept(result);
    onClose();
    setResult(null);
    setDescription("");
  };

  const handleClose = () => {
    onClose();
    setResult(null);
    setDescription("");
  };

  return (
    <Modal open={open} onClose={handleClose} title="Generate Test Case with AI" size="lg"
      description="Describe a feature in plain English and AI will create a structured test case">
      <div className="space-y-4">
        {/* AI badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-purple-400 font-medium">AI-powered generation — you can edit the result before saving</span>
        </div>

        {/* Description input */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Feature Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. User should be able to reset their password via a link sent to their registered email address"
            rows={3}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/60 transition-all resize-none"
          />
        </div>

        <button onClick={generate} disabled={loading || !description.trim()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors disabled:opacity-60 w-full justify-center">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Generating..." : "Generate Test Case"}
        </button>

        {/* Result preview */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 pt-2 border-t border-[hsl(var(--border))]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-400">✓ Generated successfully</span>
                <button onClick={generate} disabled={loading}
                  className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                  <RefreshCw className="w-3 h-3" /> Regenerate
                </button>
              </div>

              {/* Preview card */}
              <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-raised))] p-4 space-y-3 text-sm">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Title</span>
                  <p className="mt-0.5 font-medium">{result.title}</p>
                </div>
                {result.preconditions && (
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Preconditions</span>
                    <p className="mt-0.5 text-[hsl(var(--muted-foreground))]">{result.preconditions}</p>
                  </div>
                )}
                {result.test_steps?.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Test Steps</span>
                    <ol className="mt-1 space-y-1">
                      {result.test_steps.map((s: any, i: number) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-[hsl(var(--muted-foreground))] w-4 shrink-0">{s.step}.</span>
                          <span>{s.action} <span className="text-[hsl(var(--muted-foreground))]">→ {s.expected}</span></span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {result.expected_result && (
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Expected Result</span>
                    <p className="mt-0.5 text-[hsl(var(--muted-foreground))]">{result.expected_result}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button onClick={handleClose}
                  className="flex-1 py-2 rounded-lg border border-[hsl(var(--border))] text-sm hover:bg-[hsl(var(--surface-raised))] transition-colors">
                  Discard
                </button>
                <button onClick={handleAccept}
                  className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5">
                  Use this <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}