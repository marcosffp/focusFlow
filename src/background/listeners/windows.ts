import { handleActiveTabChanged, handleBrowserFocusLost } from "@background/sessionController";
import { runDetached } from "@background/runDetached";

export function registerWindowListeners(): void {
  chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      runDetached(handleBrowserFocusLost());
      return;
    }
    runDetached(
      (async (): Promise<void> => {
        const [tab] = await chrome.tabs.query({ active: true, windowId });
        if (tab?.id !== undefined && tab.url) {
          await handleActiveTabChanged({ tabId: tab.id, url: tab.url });
        }
      })(),
    );
  });
}
