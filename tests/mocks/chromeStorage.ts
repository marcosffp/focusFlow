type StorageChangeListener = (
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: string,
) => void;

export function installFakeChromeStorage(): void {
  const local: Record<string, unknown> = {};
  const listeners = new Set<StorageChangeListener>();

  const storageLocal = {
    async get(
      keys?: string | string[] | Record<string, unknown> | null,
    ): Promise<Record<string, unknown>> {
      if (keys === undefined || keys === null) {
        return structuredClone(local);
      }
      const keyList = Array.isArray(keys)
        ? keys
        : typeof keys === "string"
          ? [keys]
          : Object.keys(keys);
      const result: Record<string, unknown> = {};
      for (const key of keyList) {
        if (key in local) {
          result[key] = structuredClone(local[key]);
        }
      }
      return result;
    },

    async set(items: Record<string, unknown>): Promise<void> {
      const changes: Record<string, chrome.storage.StorageChange> = {};
      for (const [key, value] of Object.entries(items)) {
        const clonedValue = structuredClone(value);
        changes[key] = { oldValue: local[key], newValue: clonedValue };
        local[key] = clonedValue;
      }
      listeners.forEach((listener) => listener(changes, "local"));
    },
  };

  const onChanged = {
    addListener(listener: StorageChangeListener): void {
      listeners.add(listener);
    },
    removeListener(listener: StorageChangeListener): void {
      listeners.delete(listener);
    },
  };

  globalThis.chrome = {
    ...(globalThis.chrome as object | undefined),
    storage: { local: storageLocal, onChanged },
  } as typeof chrome;
}
