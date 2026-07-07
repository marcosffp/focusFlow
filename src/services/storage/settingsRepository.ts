import { createChromeStorageRepository, type Repository } from "@services/storage/repository";
import type { Settings } from "@domain/types";

const STORAGE_KEY = "settings";

export const DEFAULT_MIN_ALERT_SECONDS = 5;
export const DEFAULT_NOTIFICATIONS_ENABLED = true;
export const MIN_ALERT_SECONDS_LOWER_BOUND = 1;
export const MIN_ALERT_SECONDS_UPPER_BOUND = 300;

const DEFAULT_SETTINGS: Settings = {
  notificationsEnabled: DEFAULT_NOTIFICATIONS_ENABLED,
  minAlertSeconds: DEFAULT_MIN_ALERT_SECONDS,
};

export const settingsRepository: Repository<Settings> = createChromeStorageRepository({
  storageKey: STORAGE_KEY,
  defaultValue: DEFAULT_SETTINGS,
});
