import { createChromeStorageRepository, type Repository } from "@services/storage/repository";
import type { SessionMachineState } from "@domain/session/sessionMachine";

const STORAGE_KEY = "session";

const DEFAULT_SESSION_STATE: SessionMachineState = { status: "idle" };

export const sessionRepository: Repository<SessionMachineState> = createChromeStorageRepository({
  storageKey: STORAGE_KEY,
  defaultValue: DEFAULT_SESSION_STATE,
});
