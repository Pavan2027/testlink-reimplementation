"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { usersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserModal } from "@/components/modules/users/UserModal";
import { Users, Plus, Pencil, UserX, UserCheck, ShieldAlert } from "lucide-react";

export default function UsersPage() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list().then(r => r.data),
  });

  const toggleActive = useMutation({
    mutationFn: (u: any) => usersApi.update(u.id, { is_active: !u.is_active }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["users"] }); toast.success("User updated"); },
    onError: (err: any) => toast.error(err.response?.data?.detail || "Failed"),
  });

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (u: any) => { setEditing(u); setModalOpen(true); };

  const roleOrder = ["admin", "manager", "tester", "developer"];
  const sorted = [...users].sort((a: any, b: any) =>
    roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <PageHeader
        title="User Management"
        description="Manage team members and their access roles"
        count={users.length}
        action={
          <button onClick={openCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add User
          </button>
        }
      />

      {/* Info banner */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-5 text-sm text-amber-400">
        <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>New users are assigned temporary passwords and must change them on first login.</span>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-[hsl(var(--surface-raised))] animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title="No users yet"
            description="Create team members and assign them roles to get started"
            action={<button onClick={openCreate} className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center gap-1.5"><Plus className="w-4 h-4" />Add User</button>}
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[hsl(var(--border))]">
                {["Member", "Role", "Status", "Last Login", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((u: any, i: number) => (
                <motion.tr key={u.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--surface-raised))] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-blue-400">
                          {u.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.full_name}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge value={u.role} /></td>
                  <td className="px-4 py-3">
                    <Badge value={u.is_active ? "active" : "inactive"} />
                    {u.must_change_password && (
                      <span className="ml-1.5 text-[10px] text-amber-400 border border-amber-500/30 rounded px-1.5 py-0.5">
                        pwd change required
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u)}
                        className="p-1.5 rounded-md hover:bg-[hsl(var(--surface-overlay))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                        title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      {u.id !== me?.id && (
                        <button onClick={() => toggleActive.mutate(u)}
                          className={`p-1.5 rounded-md transition-colors ${u.is_active
                            ? "hover:bg-red-500/10 text-[hsl(var(--muted-foreground))] hover:text-red-400"
                            : "hover:bg-emerald-500/10 text-[hsl(var(--muted-foreground))] hover:text-emerald-400"}`}
                          title={u.is_active ? "Deactivate" : "Reactivate"}>
                          {u.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <UserModal open={modalOpen} onClose={() => setModalOpen(false)} user={editing} />
    </div>
  );
}