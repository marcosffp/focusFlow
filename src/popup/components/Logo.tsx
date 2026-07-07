import type { JSX } from "react";

interface LogoMarkProps {
  size: number;
}

function LogoMark({ size }: LogoMarkProps): JSX.Element {
  const radius = Math.round(size * 0.28);
  const iconSize = Math.round(size * 0.6);

  return (
    <div
      className="flex shrink-0 items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-700"
      style={{ width: size, height: size, borderRadius: radius }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        style={{ width: iconSize, height: iconSize }}
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="7"
          stroke="#C7D2FE"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="33 12"
          transform="rotate(-90 12 12)"
        />
        <circle cx="16.6" cy="7" r="1.6" fill="#ffffff" />
      </svg>
    </div>
  );
}

interface LogoProps {
  size?: number;
  showWordmark?: boolean;
}

export default function Logo({ size = 28, showWordmark = true }: LogoProps): JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <LogoMark size={size} />
      {showWordmark && (
        <span className="text-lg font-semibold text-slate-900 dark:text-white">
          Focus<span className="text-indigo-600 dark:text-indigo-400">Flow</span>
        </span>
      )}
    </div>
  );
}
