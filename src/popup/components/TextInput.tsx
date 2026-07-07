import type { InputHTMLAttributes, JSX } from "react";

export default function TextInput({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>): JSX.Element {
  return (
    <input
      {...props}
      className={`rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-white/10 dark:bg-surface-dark-elevated dark:text-white dark:placeholder:text-slate-500 ${className}`}
    />
  );
}
