import { beforeEach, describe, expect, it, vi } from "vitest";
import { installFakeChromeBrowser } from "../../../tests/mocks/chromeTabs";

const { handleAlertThresholdReachedMock, handleHeartbeatMock } = vi.hoisted(() => ({
  handleAlertThresholdReachedMock: vi.fn(() => Promise.resolve()),
  handleHeartbeatMock: vi.fn(() => Promise.resolve()),
}));

vi.mock("@background/sessionController", () => ({
  VISIT_ALERT_ALARM_PREFIX: "focusflow-visit-alert:",
  HEARTBEAT_ALARM_NAME: "focusflow-heartbeat",
  handleAlertThresholdReached: handleAlertThresholdReachedMock,
  handleHeartbeat: handleHeartbeatMock,
}));

import { registerAlarmListeners } from "./alarms";

beforeEach(() => {
  handleAlertThresholdReachedMock.mockClear();
  handleHeartbeatMock.mockClear();
});

describe("registerAlarmListeners", () => {
  it("chama handleAlertThresholdReached com o nome do alarme quando um alarme de visita dispara", () => {
    const browser = installFakeChromeBrowser({});
    registerAlarmListeners();

    browser.fireAlarm("focusflow-visit-alert:1:1000");

    expect(handleAlertThresholdReachedMock).toHaveBeenCalledWith("focusflow-visit-alert:1:1000");
  });

  it("chama handleHeartbeat quando o alarme de heartbeat dispara", () => {
    const browser = installFakeChromeBrowser({});
    registerAlarmListeners();

    browser.fireAlarm("focusflow-heartbeat");

    expect(handleHeartbeatMock).toHaveBeenCalled();
  });

  it("ignora alarmes com outro nome", () => {
    const browser = installFakeChromeBrowser({});
    registerAlarmListeners();

    browser.fireAlarm("algum-outro-alarme");

    expect(handleAlertThresholdReachedMock).not.toHaveBeenCalled();
    expect(handleHeartbeatMock).not.toHaveBeenCalled();
  });
});
