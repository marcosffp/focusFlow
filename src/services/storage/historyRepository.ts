import { createChromeStorageRepository, type Repository } from "@services/storage/repository";
import type { HistoryEntry } from "@domain/types";

const STORAGE_KEY = "history";

export const historyRepository: Repository<readonly HistoryEntry[]> = createChromeStorageRepository(
  {
    storageKey: STORAGE_KEY,
    defaultValue: [],
  },
);
