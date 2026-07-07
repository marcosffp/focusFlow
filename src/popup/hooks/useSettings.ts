import type { Settings } from "@domain/types";
import { settingsRepository } from "@services/storage/settingsRepository";
import { createSerializedQueue } from "@utils/serialized";
import { useRepositoryState } from "@popup/hooks/useRepositoryState";

export {
  MIN_ALERT_SECONDS_LOWER_BOUND,
  MIN_ALERT_SECONDS_UPPER_BOUND,
} from "@services/storage/settingsRepository";

// Fila em nível de módulo (não por chamada do hook): duas chamadas de updateSettings
// disparadas em sequência rápida (ex.: alternar notificações e editar o tempo mínimo
// de alerta quase ao mesmo tempo) não podem intercalar seus read-modify-write, senão
// uma sobrescreveria a outra com um valor desatualizado.
const serialized = createSerializedQueue();

export function useSettings(): {
  settings: Settings | null;
  updateSettings: (partial: Partial<Settings>) => Promise<void>;
} {
  const settings = useRepositoryState(settingsRepository);

  function updateSettings(partial: Partial<Settings>): Promise<void> {
    return serialized(async () => {
      const current = await settingsRepository.get();
      await settingsRepository.set({ ...current, ...partial });
    });
  }

  return { settings, updateSettings };
}
