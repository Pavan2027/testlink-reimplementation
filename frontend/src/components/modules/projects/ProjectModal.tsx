"use client";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea, FormActions } from "@/components/ui/FormFields";
import { projectsApi } from "@/lib/api";

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  project?: any;
}

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export function ProjectModal({ open, onClose, project }: ProjectModalProps) {
  const qc = useQueryClient();
  const isEdit = !!project;

  const [form, setForm] = useState({
    name: "", description: "", status: "active", start_date: "", end_date: "",
  });

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name,
        description: project.description || "",
        status: project.status,
        start_date: project.start_date || "",
        end_date: project.end_date || "",
      });
    } else {
      setForm({ name: "", description: "", status: "active", start_date: "", end_date: "" });
    }
  }, [project, open]);

  const set = (key: string) => (e: React.ChangeEvent<any>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEdit ? projectsApi.update(project.id, data) : projectsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success(isEdit ? "Project updated" : "Project created");
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Something went wrong"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      toast.error("End date cannot be before start date");
      return;
    }
    mutation.mutate({
      name: form.name,
      description: form.description || null,
      status: form.status,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    });
  };

  return (
    <Modal open={open} onClose={onClose}
      title={isEdit ? "Edit Project" : "Create Project"}
      description={isEdit ? "Update project details" : "Set up a new test project"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Project Name" value={form.name} onChange={set("name")} placeholder="e.g. E-Commerce Revamp" required />
        <Textarea label="Description" value={form.description} onChange={set("description")} placeholder="What is this project about?" rows={3} />
        {isEdit && <Select label="Status" value={form.status} onChange={set("status")} options={STATUS_OPTIONS} />}
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start Date" type="date" value={form.start_date} onChange={set("start_date")} />
          <Input label="End Date" type="date" value={form.end_date} onChange={set("end_date")} />
        </div>
        <FormActions onCancel={onClose} loading={mutation.isPending} submitLabel={isEdit ? "Save Changes" : "Create Project"} />
      </form>
    </Modal>
  );
}