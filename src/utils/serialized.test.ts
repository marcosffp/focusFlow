import { describe, expect, it } from "vitest";
import { createSerializedQueue } from "./serialized";

describe("createSerializedQueue", () => {
  it("executa as tarefas em ordem, sem intercalar um read-modify-write com outro", async () => {
    const serialized = createSerializedQueue();
    let counter = 0;
    const readValues: number[] = [];

    async function incrementSerialized(): Promise<void> {
      return serialized(async () => {
        const current = counter;
        await Promise.resolve();
        readValues.push(current);
        counter = current + 1;
      });
    }

    await Promise.all([incrementSerialized(), incrementSerialized(), incrementSerialized()]);

    expect(counter).toBe(3);
    expect(readValues).toEqual([0, 1, 2]);
  });

  it("continua processando a fila mesmo se uma tarefa rejeitar", async () => {
    const serialized = createSerializedQueue();

    const failing = serialized(() => Promise.reject(new Error("falhou")));
    const succeeding = serialized(() => Promise.resolve("ok"));

    await expect(failing).rejects.toThrow("falhou");
    await expect(succeeding).resolves.toBe("ok");
  });
});
