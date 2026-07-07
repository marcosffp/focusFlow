import type { HistoryEntry } from "@domain/types";
import { historyRepository } from "@services/storage/historyRepository";
import { useRepositoryState } from "@popup/hooks/useRepositoryState";

export function useHistory(): { entries: readonly HistoryEntry[] | null } {
  const entries = useRepositoryState(historyRepository);

  return {
    entries: entries === null ? null : [...entries].sort(byMostRecentFirst),
  };
}

function byMostRecentFirst(a: HistoryEntry, b: HistoryEntry): number {
  return b.session.startedAt - a.session.startedAt;
}
