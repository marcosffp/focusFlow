import { createChromeStorageRepository, type Repository } from "@services/storage/repository";

const STORAGE_KEY = "sessionRuntime";

export interface CurrentVisit {
  readonly tabId: number;
  readonly domain: string;
  readonly enteredAt: number;
  readonly alarmName: string;
  readonly alertedEventId: string | null;
}

export interface ProductiveTab {
  readonly tabId: number;
  readonly domain: string;
}

export interface SessionRuntimeState {
  readonly currentVisit: CurrentVisit | null;
  readonly lastProductiveTab: ProductiveTab | null;
}

export const DEFAULT_SESSION_RUNTIME_STATE: SessionRuntimeState = {
  currentVisit: null,
  lastProductiveTab: null,
};

export const sessionRuntimeRepository: Repository<SessionRuntimeState> =
  createChromeStorageRepository({
    storageKey: STORAGE_KEY,
    defaultValue: DEFAULT_SESSION_RUNTIME_STATE,
  });
