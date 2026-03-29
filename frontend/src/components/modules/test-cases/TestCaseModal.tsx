"use client";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea, FormActions } from "@/components/ui/FormFields";
import { testCasesApi, projectsApi, testPlansApi, usersApi } from "@/lib/api";
import { Plus, Trash2 } from "lucide-react";

interface TestCaseModalProps {
  open: boolean;
  onClose: () => void;
  testCase?: any;
  prefilled?: any;
  defaultProjectId?: string;
}

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export function TestCaseModal({ open, onClose, testCase, prefilled, defaultProjectId }: TestCaseModalProps) {
  const qc = useQueryClient();
  const isEdit = !!testCase;

  const emptyStep = () => ({ step: 1, action: "", expected: "" });

  const [form, setForm] = useState({
    project_id: defaultProjectId || "",
    test_plan_id: "",
    title: "",
    description: "",
    preconditions: "",
    expected_result: "",
    priority: "medium",
    assigned_to: "",
  });
  const [steps, setSteps] = useState([emptyStep()]);
  const [aiGenerated, setAiGenerated] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list().then(r => r.data),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ["test-plans", form.project_id],
    queryFn: () => testPlansApi.list(form.project_id).then(r => r.data),
    enabled: !!form.project_id,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list().then(r => r.data),
  });

  // Auto-select first project once projects load if nothing selected yet
  useEffect(() => {
    if (!isEdit && !form.project_id && (projects as any[]).length > 0) {
      const firstId = defaultProjectId || (projects as any[])[0].id;
      setForm(f => ({ ...f, project_id: firstId }));
    }
  }, [projects, isEdit, defaultProjectId]);

  // Populate form when editing or when AI prefill arrives
  useEffect(() => {
    if (!open) return;

    if (testCase) {
      setForm({
        project_id: testCase.project_id,
        test_plan_id: testCase.test_plan_id || "",
        title: testCase.title,
        description: testCase.description || "",
        preconditions: testCase.preconditions || "",
        expected_result: testCase.expected_result || "",
        priority: testCase.priority,
        assigned_to: testCase.assigned_to || "",
      });
      setSteps(testCase.test_steps?.length ? testCase.test_steps : [emptyStep()]);
      setAiGenerated(false);
    } else if (prefilled) {
      setForm(f => ({
        ...f,
        project_id: defaultProjectId || f.project_id,
        title: prefilled.title || "",
        description: prefilled.description || "",
        preconditions: prefilled.preconditions || "",
        expected_result: prefilled.expected_result || "",
        priority: prefilled.priority || "medium",
      }));
      setSteps(prefilled.test_steps?.length ? prefilled.test_steps : [emptyStep()]);
      setAiGenerated(true);
    } else {
      setForm({
        project_id: defaultProjectId || (projects as any[])[0]?.id || "",
        test_plan_id: "",
        title: "",
        description: "",
        preconditions: "",
        expected_result: "",
        priority: "medium",
        assigned_to: "",
      });
      setSteps([emptyStep()]);
      setAiGenerated(false);
    }
  }, [testCase, prefilled, open]);

  // When project changes, reset plan selection
  const set = (key: string) => (e: React.ChangeEvent<any>) => {
    const value = e.target.value;
    setForm(f => ({
      ...f,
      [key]: value,
      ...(key === "project_id" ? { test_plan_id: "" } : {}),
    }));
  };

  const testerOptions = [
    { value: "", label: "Unassigned" },
    ...(users as any[])
      .filter((u: any) => ["tester", "manager", "admin"].includes(u.role))
      .map((u: any) => ({ value: u.id, label: u.full_name })),
  ];

  const planOptions = [
    { value: "", label: "No plan" },
    ...(plans as any[]).map((p: any) => ({ value: p.id, label: p.name })),
  ];

  const projectOptions = (projects as any[]).map((p: any) => ({
    value: p.id,
    label: p.name,
  }));

  const addStep = () =>
    setSteps(s => [...s, { step: s.length + 1, action: "", expected: "" }]);

  const removeStep = (i: number) =>
    setSteps(s =>
      s.filter((_, idx) => idx !== i).map((st, idx) => ({ ...st, step: idx + 1 }))
    );

  const updateStep = (i: number, key: "action" | "expected", val: string) =>
    setSteps(s => s.map((st, idx) => (idx === i ? { ...st, [key]: val } : st)));

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEdit ? testCasesApi.update(testCase.id, data) : testCasesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["test-cases"] });
      toast.success(isEdit ? "Test case updated" : "Test case created");
      onClose();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.detail || "Something went wrong"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.project_id) {
      toast.error("Please select a project");
      return;
    }
    mutation.mutate({
      ...form,
      test_plan_id: form.test_plan_id || null,
      assigned_to: form.assigned_to || null,
      test_steps: steps.filter(s => s.action.trim()),
      ai_generated: aiGenerated,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? "Edit Test Case" : "Create Test Case"}
      description={
        aiGenerated
          ? "✨ Pre-filled by AI — review and edit before saving"
          : undefined
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
        {!isEdit && (
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Project *"
              value={form.project_id}
              onChange={set("project_id")}
              options={
                projectOptions.length
                  ? projectOptions
                  : [{ value: "", label: "No projects" }]
              }
            />
            <Select
              label="Test Plan"
              value={form.test_plan_id}
              onChange={set("test_plan_id")}
              options={planOptions}
            />
          </div>
        )}

        <Input
          label="Title *"
          value={form.title}
          onChange={set("title")}
          placeholder="e.g. Verify user login with valid credentials"
          required
        />

        <Textarea
          label="Description"
          value={form.description}
          onChange={set("description")}
          placeholder="What does this test validate?"
        />

        <Textarea
          label="Preconditions"
          value={form.preconditions}
          onChange={set("preconditions")}
          placeholder="What must be true before running this test?"
        />

        {/* Test steps */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Test Steps</label>
            <button
              type="button"
              onClick={addStep}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Step
            </button>
          </div>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div
                key={i}
                className="flex gap-2 items-start p-2.5 rounded-lg bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))]"
              >
                <span className="text-xs text-[hsl(var(--muted-foreground))] mt-2.5 w-5 shrink-0 text-center">
                  {step.step}
                </span>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    value={step.action}
                    onChange={e => updateStep(i, "action", e.target.value)}
                    placeholder="Action"
                    className="px-2.5 py-1.5 rounded-md bg-[hsl(var(--surface))] border border-[hsl(var(--border))] text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                  />
                  <input
                    value={step.expected}
                    onChange={e => updateStep(i, "expected", e.target.value)}
                    placeholder="Expected result"
                    className="px-2.5 py-1.5 rounded-md bg-[hsl(var(--surface))] border border-[hsl(var(--border))] text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                  />
                </div>
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStep(i)}
                    className="text-[hsl(var(--muted-foreground))] hover:text-red-400 transition-colors mt-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <Textarea
          label="Expected Result (overall)"
          value={form.expected_result}
          onChange={set("expected_result")}
          placeholder="What is the overall expected outcome?"
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Priority"
            value={form.priority}
            onChange={set("priority")}
            options={PRIORITY_OPTIONS}
          />
          <Select
            label="Assign To"
            value={form.assigned_to}
            onChange={set("assigned_to")}
            options={testerOptions}
          />
        </div>

        <FormActions
          onCancel={onClose}
          loading={mutation.isPending}
          submitLabel={isEdit ? "Save Changes" : "Create Test Case"}
        />
      </form>
    </Modal>
  );
}