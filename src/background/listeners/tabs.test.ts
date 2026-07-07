import { beforeEach, describe, expect, it, vi } from "vitest";
import { installFakeChromeBrowser } from "../../../tests/mocks/chromeTabs";

const { handleActiveTabChangedMock } = vi.hoisted(() => ({
  handleActiveTabChangedMock: vi.fn(() => Promise.resolve()),
}));

vi.mock("@background/sessionController", () => ({
  handleActiveTabChanged: handleActiveTabChangedMock,
}));

import { registerTabListeners } from "./tabs";

beforeEach(() => {
  handleActiveTabChangedMock.mockClear();
});

describe("registerTabListeners", () => {
  it("chama handleActiveTabChanged quando a aba ativada está em uma janela com foco", async () => {
    const browser = installFakeChromeBrowser({
      tabs: [{ id: 1, url: "https://youtube.com", active: true, windowId: 1 }],
      windows: [{ id: 1, focused: true }],
    });
    registerTabListeners();

    browser.fireTabActivated({ tabId: 1, windowId: 1 });
    await vi.waitFor(() => {
      expect(handleActiveTabChangedMock).toHaveBeenCalled();
    });

    expect(handleActiveTabChangedMock).toHaveBeenCalledWith({
      tabId: 1,
      url: "https://youtube.com",
    });
  });

  it("não chama handleActiveTabChanged quando a janela da aba não está em foco", async () => {
    const browser = installFakeChromeBrowser({
      tabs: [{ id: 1, url: "https://youtube.com", active: true, windowId: 1 }],
      windows: [{ id: 1, focused: false }],
    });
    registerTabListeners();

    browser.fireTabActivated({ tabId: 1, windowId: 1 });
    await Promise.resolve();
    await Promise.resolve();

    expect(handleActiveTabChangedMock).not.toHaveBeenCalled();
  });

  it("não chama handleActiveTabChanged para atualização de URL em aba sem foco no momento", async () => {
    const browser = installFakeChromeBrowser({
      tabs: [{ id: 1, url: "https://youtube.com", active: false, windowId: 1 }],
      windows: [{ id: 1, focused: true }],
    });
    registerTabListeners();

    browser.fireTabUpdated(1, { url: "https://youtube.com" });
    await Promise.resolve();

    expect(handleActiveTabChangedMock).not.toHaveBeenCalled();
  });
});
