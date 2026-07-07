// Encadeia tarefas assíncronas para que um read-modify-write (get -> merge -> set)
// nunca se intercale com outro sobre o mesmo repositório, o que perderia a escrita
// mais antiga (duas chamadas concorrentes leriam o mesmo estado antes de qualquer
// uma persistir de volta).
export function createSerializedQueue(): <T>(task: () => Promise<T>) => Promise<T> {
  let queue: Promise<unknown> = Promise.resolve();

  return function serialized<T>(task: () => Promise<T>): Promise<T> {
    const result = queue.then(task, task);
    queue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };
}
