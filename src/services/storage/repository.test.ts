import { beforeEach, describe, expect, it, vi } from "vitest";
import { installFakeChromeStorage } from "../../../tests/mocks/chromeStorage";
import { createChromeStorageRepository } from "./repository";

beforeEach(() => {
  installFakeChromeStorage();
});

describe("createChromeStorageRepository", () => {
  it("retorna o valor default quando o storage está vazio", async () => {
    const repository = createChromeStorageRepository({ storageKey: "test-key", defaultValue: 42 });

    expect(await repository.get()).toBe(42);
  });

  it("persiste e recupera o valor gravado", async () => {
    const repository = createChromeStorageRepository({ storageKey: "test-key", defaultValue: 0 });

    await repository.set(7);

    expect(await repository.get()).toBe(7);
  });

  it("mantém repositórios com chaves diferentes isolados entre si", async () => {
    const repositoryA = createChromeStorageRepository({ storageKey: "key-a", defaultValue: "a" });
    const repositoryB = createChromeStorageRepository({ storageKey: "key-b", defaultValue: "b" });

    await repositoryA.set("mudou");

    expect(await repositoryA.get()).toBe("mudou");
    expect(await repositoryB.get()).toBe("b");
  });

  it("notifica o callback de onChange quando o valor muda", async () => {
    const repository = createChromeStorageRepository({ storageKey: "test-key", defaultValue: 0 });
    const callback = vi.fn();
    repository.onChange(callback);

    await repository.set(99);

    expect(callback).toHaveBeenCalledWith(99);
  });

  it("para de notificar depois que o unsubscribe é chamado", async () => {
    const repository = createChromeStorageRepository({ storageKey: "test-key", defaultValue: 0 });
    const callback = vi.fn();
    const unsubscribe = repository.onChange(callback);

    unsubscribe();
    await repository.set(99);

    expect(callback).not.toHaveBeenCalled();
  });

  it("nunca expõe a referência compartilhada do defaultValue, mesmo que o chamador mute o retorno", async () => {
    const defaultValue = { items: [] as string[] };
    const repository = createChromeStorageRepository({ storageKey: "test-key", defaultValue });

    const first = await repository.get();
    first.items.push("mutou");

    const second = await repository.get();
    expect(second.items).toEqual([]);
  });
});
