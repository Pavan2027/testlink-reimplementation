interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  count?: number;
}

export function PageHeader({ title, description, action, count }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-lg font-semibold">{title}</h1>
          {count !== undefined && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--surface-raised))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))] tabular-nums">
              {count}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}