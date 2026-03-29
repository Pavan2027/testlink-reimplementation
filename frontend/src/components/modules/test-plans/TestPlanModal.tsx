"use client";
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea, FormActions } from "@/components/ui/FormFields";
import { testPlansApi, projectsApi } from "@/lib/api";

interface TestPlanModalProps {
  open: boolean;
  onClose: () => void;
  plan?: any;
  defaultProjectId?: string;
}

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
];

export function TestPlanModal({ open, onClose, plan, defaultProjectId }: TestPlanModalProps) {
  const qc = useQueryClient();
  const isEdit = !!plan;

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.list().then(r => r.data),
  });

  const activeProjects = projects.filter((p: any) => p.status === "active");
  const projectOptions = activeProjects.map((p: any) => ({ value: p.id, label: p.name }));

  const [form, setForm] = useState({
    project_id: defaultProjectId || "",
    name: "",
    description: "",
    status: "draft",
  });

  useEffect(() => {
    if (plan) {
      setForm({ project_id: plan.project_id, name: plan.name, description: plan.description || "", status: plan.status });
    } else {
      setForm({ project_id: defaultProjectId || activeProjects[0]?.id || "", name: "", description: "", status: "draft" });
    }
  }, [plan, open, defaultProjectId]);

  const set = (key: string) => (e: React.ChangeEvent<any>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEdit ? testPlansApi.update(plan.id, data) : testPlansApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["test-plans"] });
      toast.success(isEdit ? "Test plan updated" : "Test plan created");
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Something went wrong"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.project_id) { toast.error("Please select a project"); return; }
    mutation.mutate({ project_id: form.project_id, name: form.name, description: form.description || null, status: form.status });
  };

  return (
    <Modal open={open} onClose={onClose}
      title={isEdit ? "Edit Test Plan" : "Create Test Plan"}
      description="Test plans group related test cases together">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!isEdit && (
          <Select label="Project" value={form.project_id} onChange={set("project_id")}
            options={projectOptions.length ? projectOptions : [{ value: "", label: "No active projects" }]}
          />
        )}
        <Input label="Plan Name" value={form.name} onChange={set("name")} placeholder="e.g. Master Regression Plan" required />
        <Textarea label="Description" value={form.description} onChange={set("description")} placeholder="What does this plan cover?" />
        <Select label="Status" value={form.status} onChange={set("status")} options={STATUS_OPTIONS} />
        <FormActions onCancel={onClose} loading={mutation.isPending} submitLabel={isEdit ? "Save Changes" : "Create Plan"} />
      </form>
    </Modal>
  );
}