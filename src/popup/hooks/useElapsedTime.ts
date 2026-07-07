import { useEffect, useState } from "react";
import type { Session } from "@domain/types";
import { calculateElapsedTime, type ElapsedTime } from "@domain/session/sessionMetrics";
import { DEFAULT_MIN_ALERT_SECONDS } from "@services/storage/settingsRepository";
import { useSettings } from "@popup/hooks/useSettings";

const TICK_INTERVAL_MS = 1000;

export function useElapsedTime(session: Session): ElapsedTime {
  const { settings } = useSettings();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // Não é polling de storage (proibido por PADRAO_DE_CODIGO.md §5) — é apenas o
    // tick de UI que reexibe o relógio a partir dos timestamps já conhecidos.
    const intervalId = setInterval(() => setNow(Date.now()), TICK_INTERVAL_MS);
    return (): void => clearInterval(intervalId);
  }, []);

  const minAlertSeconds = settings?.minAlertSeconds ?? DEFAULT_MIN_ALERT_SECONDS;
  return calculateElapsedTime(session, now, minAlertSeconds);
}
