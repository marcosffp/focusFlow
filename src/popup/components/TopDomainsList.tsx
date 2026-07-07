import type { JSX } from "react";
import type { DomainTimeBreakdown } from "@domain/types";
import { formatDuration } from "@utils/formatDuration";

interface TopDomainsListProps {
  domains: readonly DomainTimeBreakdown[];
  emptyMessage: string;
}

export default function TopDomainsList({
  domains,
  emptyMessage,
}: TopDomainsListProps): JSX.Element {
  if (domains.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>;
  }

  return (
    <ul className="mt-1 flex flex-col gap-1">
      {domains.map((domain) => (
        <li
          key={domain.domain}
          className="flex justify-between rounded-lg px-2 py-1 text-sm text-slate-700 dark:text-slate-300"
        >
          <span>{domain.domain}</span>
          <span className="font-mono">{formatDuration(domain.seconds)}</span>
        </li>
      ))}
    </ul>
  );
}
