import { CURRENT_SCHEMA_VERSION } from "@services/storage/schemaVersion";

export interface Repository<T> {
  get(): Promise<T>;
  set(value: T): Promise<void>;
  onChange(callback: (value: T) => void): () => void;
}

interface StorageEnvelope<T> {
  version: number;
  value: T;
}

export function createChromeStorageRepository<T>(input: {
  storageKey: string;
  defaultValue: T;
}): Repository<T> {
  const { storageKey, defaultValue } = input;

  return {
    async get(): Promise<T> {
      const stored = await chrome.storage.local.get(storageKey);
      const envelope = stored[storageKey] as StorageEnvelope<T> | undefined;
      return envelope ? envelope.value : structuredClone(defaultValue);
    },

    async set(value: T): Promise<void> {
      const envelope: StorageEnvelope<T> = { version: CURRENT_SCHEMA_VERSION, value };
      await chrome.storage.local.set({ [storageKey]: envelope });
    },

    onChange(callback: (value: T) => void): () => void {
      const listener = (
        changes: Record<string, chrome.storage.StorageChange>,
        areaName: string,
      ): void => {
        if (areaName !== "local") {
          return;
        }
        const change = changes[storageKey];
        if (!change) {
          return;
        }
        const envelope = change.newValue as StorageEnvelope<T> | undefined;
        callback(envelope ? envelope.value : structuredClone(defaultValue));
      };
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    },
  };
}
