import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-[hsl(var(--surface-raised))] flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
      </div>
      <h3 className="text-sm font-medium mb-1">{title}</h3>
      <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}