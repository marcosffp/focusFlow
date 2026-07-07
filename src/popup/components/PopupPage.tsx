import type { JSX, ReactNode } from "react";

interface PopupPageProps {
  children: ReactNode;
}

export default function PopupPage({ children }: PopupPageProps): JSX.Element {
  return (
    <div className="flex w-80 flex-col gap-4 bg-white p-4 text-slate-900 dark:bg-surface-dark dark:text-white">
      {children}
    </div>
  );
}
