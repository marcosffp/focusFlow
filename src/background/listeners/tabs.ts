import { handleActiveTabChanged } from "@background/sessionController";
import { runDetached } from "@background/runDetached";

async function isWindowFocused(windowId: number): Promise<boolean> {
  const window = await chrome.windows.get(windowId);
  return window.focused;
}

export function registerTabListeners(): void {
  chrome.tabs.onActivated.addListener((activeInfo) => {
    runDetached(
      (async (): Promise<void> => {
        if (!(await isWindowFocused(activeInfo.windowId))) {
          return;
        }
        const tab = await chrome.tabs.get(activeInfo.tabId);
        if (tab.url) {
          await handleActiveTabChanged({ tabId: activeInfo.tabId, url: tab.url });
        }
      })(),
    );
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    const url = changeInfo.url;
    if (!url || !tab.active) {
      return;
    }
    runDetached(
      (async (): Promise<void> => {
        if (!(await isWindowFocused(tab.windowId))) {
          return;
        }
        await handleActiveTabChanged({ tabId, url });
      })(),
    );
  });
}
