import { useEffect, useState } from "react";
import type { Repository } from "@services/storage/repository";
import { logRejection } from "@utils/logRejection";

// chrome.storage.onChanged não emite o valor atual na assinatura — por isso ainda
// precisamos de um get() inicial além do onChange, mesclado com `current ?? initial`
// para não sobrescrever um valor que já tenha chegado por um onChange mais rápido.
export function useRepositoryState<T>(repository: Repository<T>): T | null {
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    const unsubscribe = repository.onChange(setValue);
    logRejection(
      repository.get().then((initialValue) => {
        setValue((current) => current ?? initialValue);
      }),
    );
    return unsubscribe;
  }, [repository]);

  return value;
}
