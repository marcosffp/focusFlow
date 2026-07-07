import type { JSX, ReactNode } from "react";

interface SectionLabelProps {
  children: ReactNode;
  tone?: "muted" | "light";
}

const TONE_CLASSES: Record<NonNullable<SectionLabelProps["tone"]>, string> = {
  muted: "text-slate-400 dark:text-slate-500",
  light: "text-indigo-200",
};

export default function SectionLabel({ children, tone = "muted" }: SectionLabelProps): JSX.Element {
  return (
    <p className={`text-xs font-medium tracking-wide uppercase ${TONE_CLASSES[tone]}`}>
      {children}
    </p>
  );
}
