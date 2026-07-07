import type { Result } from "@shared-types/index";
import { routeMessage } from "@background/messageRouter";
import { registerBackgroundListeners } from "@background/listeners";

console.log("FocusFlow: background service worker iniciado");

registerBackgroundListeners();

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  Promise.resolve()
    .then(() => routeMessage(message))
    .catch((error: unknown): Result<void> => ({
      ok: false,
      reason: error instanceof Error ? error.message : "erro desconhecido",
    }))
    .then(sendResponse);
  return true;
});
