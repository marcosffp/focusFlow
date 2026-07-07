import type { JSX } from "react";
import { formatDuration } from "@utils/formatDuration";
import SectionLabel from "@popup/components/SectionLabel";

interface TimerProps {
  label: string;
  seconds: number;
}

export default function Timer({ label, seconds }: TimerProps): JSX.Element {
  return (
    <div className="flex flex-col">
      <SectionLabel>{label}</SectionLabel>
      <span className="font-mono text-2xl font-medium text-slate-900 dark:text-white">
        {formatDuration(seconds)}
      </span>
    </div>
  );
}
