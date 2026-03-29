"use client";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, FormActions } from "@/components/ui/FormFields";
import { usersApi } from "@/lib/api";

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  user?: any;   // if provided, we're editing
}

const ROLE_OPTIONS = [
  { value: "admin", label: "System Administrator" },
  { value: "manager", label: "Test Manager" },
  { value: "tester", label: "Tester" },
  { value: "developer", label: "Developer" },
];

export function UserModal({ open, onClose, user }: UserModalProps) {
  const qc = useQueryClient();
  const isEdit = !!user;

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "tester",
  });

  useEffect(() => {
    if (user) {
      setForm({ full_name: user.full_name, email: user.email, password: "", role: user.role });
    } else {
      setForm({ full_name: "", email: "", password: "", role: "tester" });
    }
  }, [user, open]);

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEdit ? usersApi.update(user.id, data) : usersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(isEdit ? "User updated" : "User created — they must change password on first login");
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Something went wrong"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { full_name: form.full_name, role: form.role };
    if (!isEdit) { data.email = form.email; data.password = form.password; }
    mutation.mutate(data);
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit User" : "Create User"}
      description={isEdit ? "Update user details or role" : "New users must change their password on first login"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Full Name" value={form.full_name} onChange={set("full_name")} placeholder="Jane Smith" required />
        {!isEdit && (
          <>
            <Input label="Email" type="email" value={form.email} onChange={set("email")} placeholder="jane@company.com" required />
            <Input label="Temporary Password" type="password" value={form.password} onChange={set("password")} placeholder="••••••••" required minLength={8} />
          </>
        )}
        <Select label="Role" value={form.role} onChange={set("role")} options={ROLE_OPTIONS} />
        <FormActions onCancel={onClose} loading={mutation.isPending} submitLabel={isEdit ? "Save Changes" : "Create User"} />
      </form>
    </Modal>
  );
}