// Listeners de eventos do Chrome (tabs/windows/alarms/notifications) não têm para quem
// propagar uma rejeição — este é o nível mais alto possível para esses callbacks, então
// logar aqui é a decisão explícita e segura que PADRAO_DE_CODIGO.md seção 4 exige.
export function runDetached(promise: Promise<unknown>): void {
  promise.catch((error: unknown) => {
    console.error("FocusFlow: erro não tratado em listener de background", error);
  });
}
