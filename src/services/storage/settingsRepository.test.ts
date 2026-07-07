import { beforeEach, describe, expect, it } from "vitest";
import { installFakeChromeStorage } from "../../../tests/mocks/chromeStorage";
import {
  DEFAULT_MIN_ALERT_SECONDS,
  DEFAULT_NOTIFICATIONS_ENABLED,
  settingsRepository,
} from "./settingsRepository";

beforeEach(() => {
  installFakeChromeStorage();
});

describe("settingsRepository", () => {
  it("retorna as configurações default na primeira execução (storage vazio)", async () => {
    expect(await settingsRepository.get()).toEqual({
      notificationsEnabled: DEFAULT_NOTIFICATIONS_ENABLED,
      minAlertSeconds: DEFAULT_MIN_ALERT_SECONDS,
    });
  });

  it("persiste alterações de configurações", async () => {
    await settingsRepository.set({ notificationsEnabled: false, minAlertSeconds: 10 });

    expect(await settingsRepository.get()).toEqual({
      notificationsEnabled: false,
      minAlertSeconds: 10,
    });
  });
});
