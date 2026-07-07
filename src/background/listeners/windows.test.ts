import { beforeEach, describe, expect, it, vi } from "vitest";
import { installFakeChromeBrowser } from "../../../tests/mocks/chromeTabs";

const { handleActiveTabChangedMock, handleBrowserFocusLostMock } = vi.hoisted(() => ({
  handleActiveTabChangedMock: vi.fn(() => Promise.resolve()),
  handleBrowserFocusLostMock: vi.fn(() => Promise.resolve()),
}));

vi.mock("@background/sessionController", () => ({
  handleActiveTabChanged: handleActiveTabChangedMock,
  handleBrowserFocusLost: handleBrowserFocusLostMock,
}));

import { registerWindowListeners } from "./windows";

beforeEach(() => {
  handleActiveTabChangedMock.mockClear();
  handleBrowserFocusLostMock.mockClear();
});

describe("registerWindowListeners", () => {
  it("chama handleActiveTabChanged com a aba ativa da janela recém-focada", async () => {
    const browser = installFakeChromeBrowser({
      tabs: [{ id: 1, url: "https://youtube.com", active: true, windowId: 1 }],
      windows: [{ id: 1, focused: true }],
    });
    registerWindowListeners();

    browser.fireWindowFocusChanged(1);
    await vi.waitFor(() => {
      expect(handleActiveTabChangedMock).toHaveBeenCalled();
    });

    expect(handleActiveTabChangedMock).toHaveBeenCalledWith({
      tabId: 1,
      url: "https://youtube.com",
    });
  });

  it("chama handleBrowserFocusLost quando nenhuma janela está mais em foco (WINDOW_ID_NONE)", async () => {
    const browser = installFakeChromeBrowser({ tabs: [], windows: [] });
    registerWindowListeners();

    browser.fireWindowFocusChanged(chrome.windows.WINDOW_ID_NONE);
    await vi.waitFor(() => {
      expect(handleBrowserFocusLostMock).toHaveBeenCalled();
    });

    expect(handleActiveTabChangedMock).not.toHaveBeenCalled();
  });
});
