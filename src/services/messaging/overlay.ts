export type OverlayMessage =
  | { type: "SHOW_ASK_OVERLAY"; eventId: string; domain: string }
  | { type: "SHOW_LEFT_FOCUS_OVERLAY" }
  | { type: "HIDE_OVERLAY" };

// Content scripts declarados no manifest só são injetados em navegações que acontecem
// depois da extensão estar carregada — uma aba que já estava aberta antes disso nunca
// recebe o script sozinha. Por isso, quando o primeiro envio falha, injetamos sob
// demanda e tentamos de novo antes de desistir.
async function injectContentScript(tabId: number): Promise<void> {
  const contentScripts = chrome.runtime.getManifest().content_scripts;
  const files = contentScripts?.[0]?.js;
  if (!files) {
    return;
  }
  await chrome.scripting.executeScript({ target: { tabId }, files });
}

export async function sendToTab(tabId: number, message: OverlayMessage): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch {
    try {
      await injectContentScript(tabId);
      await chrome.tabs.sendMessage(tabId, message);
    } catch {
      // Aba sem página http/https (ex.: chrome://), navegação em andamento antes da
      // injeção completar, ou aba já fechada — esperado e seguro de ignorar, equivalente
      // a uma notificação que o usuário nunca chega a ver.
    }
  }
}
