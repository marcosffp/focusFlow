import { useEffect } from "react";
import type { Result } from "@shared-types/index";
import type { SessionMachineState } from "@domain/session/sessionMachine";
import { sessionRepository } from "@services/storage/sessionRepository";
import { sendMessage } from "@services/messaging/sendMessage";
import { useSessionStore } from "@popup/store/sessionStore";
import { logRejection } from "@utils/logRejection";

interface UseSessionStateResult {
  state: SessionMachineState | null;
  startSession: (objective: string) => Promise<Result<void>>;
  endSession: () => Promise<Result<void>>;
  dismissReport: () => Promise<Result<void>>;
}

export function useSessionState(): UseSessionStateResult {
  const state = useSessionStore((store) => store.state);
  const setState = useSessionStore((store) => store.setState);

  useEffect(() => {
    const unsubscribe = sessionRepository.onChange(setState);
    logRejection(
      sessionRepository.get().then((initialState) => {
        if (useSessionStore.getState().state === null) {
          setState(initialState);
        }
      }),
    );
    return unsubscribe;
  }, [setState]);

  return {
    state,
    startSession: (objective: string) => sendMessage({ type: "START_SESSION", objective }),
    endSession: () => sendMessage({ type: "END_SESSION" }),
    dismissReport: () => sendMessage({ type: "DISMISS_REPORT" }),
  };
}
