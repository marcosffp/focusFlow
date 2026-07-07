import { describe, expect, it } from "vitest";
import { installFakeChromeBrowser } from "../../../tests/mocks/chromeTabs";
import { sendToTab } from "@services/messaging/overlay";

describe("sendToTab", () => {
  it("entrega a mensagem direto quando a aba já tem o content script", async () => {
    const browser = installFakeChromeBrowser({
      tabs: [{ id: 1, url: "https://youtube.com", active: true, windowId: 1 }],
    });

    await sendToTab(1, { type: "SHOW_LEFT_FOCUS_OVERLAY" });

    expect(browser.tabMessages.get(1)).toEqual([{ type: "SHOW_LEFT_FOCUS_OVERLAY" }]);
  });

  it("injeta o content script e reenvia quando a aba já estava aberta antes da extensão carregar", async () => {
    const browser = installFakeChromeBrowser({
      tabs: [
        { id: 1, url: "https://youtube.com", active: true, windowId: 1, hasContentScript: false },
      ],
    });

    await sendToTab(1, { type: "SHOW_LEFT_FOCUS_OVERLAY" });

    expect(browser.tabs.get(1)?.hasContentScript).toBe(true);
    expect(browser.tabMessages.get(1)).toEqual([{ type: "SHOW_LEFT_FOCUS_OVERLAY" }]);
  });

  it("ignora silenciosamente quando a aba não existe mais", async () => {
    installFakeChromeBrowser({ tabs: [] });

    await expect(sendToTab(999, { type: "HIDE_OVERLAY" })).resolves.toBeUndefined();
  });
});
