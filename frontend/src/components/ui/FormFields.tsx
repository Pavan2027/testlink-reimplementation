import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const inputClass = "w-full px-3.5 py-2.5 rounded-lg bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 transition-all";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium">{label}</label>}
      <input ref={ref} className={`${inputClass} ${error ? "border-red-500/60" : ""} ${className}`} {...props} />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";

export function Select({ label, error, options, className = "", ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium">{label}</label>}
      <select
        className={`${inputClass} ${error ? "border-red-500/60" : ""} ${className}`}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = "", ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium">{label}</label>}
      <textarea
        ref={ref}
        rows={3}
        className={`${inputClass} resize-none ${error ? "border-red-500/60" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
);
Textarea.displayName = "Textarea";

export function FormActions({ onCancel, loading, submitLabel = "Save" }: {
  onCancel: () => void;
  loading?: boolean;
  submitLabel?: string;
}) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-sm rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--surface-raised))] transition-colors"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-60 flex items-center gap-2"
      >
        {loading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
        {submitLabel}
      </button>
    </div>
  );
}