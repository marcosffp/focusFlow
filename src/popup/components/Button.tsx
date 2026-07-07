import type { ButtonHTMLAttributes, JSX } from "react";

type ButtonVariant = "primary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400",
  ghost:
    "text-sm font-medium text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
};

export default function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps): JSX.Element {
  return (
    <button type="button" {...props} className={`${VARIANT_CLASSES[variant]} ${className}`} />
  );
}
