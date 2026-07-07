import { create } from "zustand";
import type { SessionMachineState } from "@domain/session/sessionMachine";

interface SessionStore {
  state: SessionMachineState | null;
  setState: (state: SessionMachineState) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  state: null,
  setState: (state): void => set({ state }),
}));
