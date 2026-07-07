import type { HTMLAttributes, JSX } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement | HTMLLIElement> {
  as?: "div" | "li";
}

export default function Card({ as = "div", className = "", ...props }: CardProps): JSX.Element {
  const Tag = as;
  return (
    <Tag
      {...props}
      className={`rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-surface-dark-elevated ${className}`}
    />
  );
}
