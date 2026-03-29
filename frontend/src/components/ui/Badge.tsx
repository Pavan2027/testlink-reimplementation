interface BadgeProps {
  value: string;
  className?: string;
}

// Maps any status/role/priority value to its CSS badge class
export function Badge({ value, className = "" }: BadgeProps) {
  const normalized = value?.toLowerCase().replace(" ", "_") ?? "unknown";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium badge-${normalized} ${className}`}>
      {value?.replace("_", " ")}
    </span>
  );
}

// Dot indicator for status
export function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-400",
    draft: "bg-zinc-400",
    archived: "bg-purple-400",
    passed: "bg-emerald-400",
    failed: "bg-red-400",
    blocked: "bg-amber-400",
    not_run: "bg-zinc-400",
    open: "bg-red-400",
    in_progress: "bg-blue-400",
    resolved: "bg-emerald-400",
    closed: "bg-zinc-400",
  };
  return (
    <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors[status] ?? "bg-zinc-400"}`} />
  );
}