import type { DistractionSite } from "@domain/types";
import { distractionSiteRepository } from "@services/storage/distractionSiteRepository";
import { createSerializedQueue } from "@utils/serialized";
import { useRepositoryState } from "@popup/hooks/useRepositoryState";

// Fila em nível de módulo: adicionar/remover sites em sequência rápida não pode
// intercalar o read-modify-write de cada chamada, senão uma sobrescreveria a outra.
const serialized = createSerializedQueue();

export function useDistractionSites(): {
  sites: readonly DistractionSite[] | null;
  addSite: (domain: string) => Promise<void>;
  removeSite: (domain: string) => Promise<void>;
} {
  const sites = useRepositoryState(distractionSiteRepository);

  function addSite(domain: string): Promise<void> {
    return serialized(async () => {
      const normalizedDomain = domain.trim().toLowerCase();
      if (normalizedDomain.length === 0) {
        return;
      }
      const current = await distractionSiteRepository.get();
      if (current.some((site) => site.domain === normalizedDomain)) {
        return;
      }
      await distractionSiteRepository.set([
        ...current,
        { domain: normalizedDomain, isActive: true },
      ]);
    });
  }

  function removeSite(domain: string): Promise<void> {
    return serialized(async () => {
      const current = await distractionSiteRepository.get();
      await distractionSiteRepository.set(current.filter((site) => site.domain !== domain));
    });
  }

  return { sites, addSite, removeSite };
}
