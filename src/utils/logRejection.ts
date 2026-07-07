// Ações disparadas pela UI (iniciar/finalizar sessão, editar configurações etc.) já
// comunicam falhas esperadas de domínio através do tipo Result — o que chega aqui é
// sempre uma falha inesperada (ex.: chrome.storage indisponível), e não há ação de
// recuperação possível no popup além de registrar no console para depuração.
export function logRejection(promise: Promise<unknown>): void {
  promise.catch(console.error);
}
