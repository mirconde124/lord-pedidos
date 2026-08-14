import { cn } from '../lib/cn';

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('bg-card border border-border rounded-lg shadow-[var(--shadow-card)]', className)} {...props}>
      {children}
    </div>
  );
}

export function Field({ label, required, children, className }) {
  return (
    <label className={cn('block mb-3', className)}>
      {label && <div className="text-xs font-medium text-text-2 mb-1.5">{label}{required && ' *'}</div>}
      {children}
    </label>
  );
}

const fieldClass = 'w-full rounded-sm border border-border bg-bg px-3 py-2.5 text-[13.5px] text-text-1 placeholder:text-text-2 focus:outline-none focus:border-blue focus:ring-4 focus:ring-blue-tint transition-colors duration-150';

export function Input({ className, ...props }) {
  return <input className={cn(fieldClass, className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn(fieldClass, className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(fieldClass, 'resize-y', className)} {...props} />;
}

const BUTTON_VARIANTS = {
  primary: 'bg-blue text-white shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] hover:-translate-y-px',
  secondary: 'bg-card border border-border text-text-1 hover:bg-[#F4F6F9]',
  ghost: 'bg-transparent text-text-2 hover:bg-[#F4F6F9] hover:text-text-1',
};

export function Button({ variant = 'secondary', className, children, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-[13px] font-semibold transition-all duration-200 ease-out cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.secondary,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
