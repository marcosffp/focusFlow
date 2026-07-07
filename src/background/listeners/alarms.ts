import {
  VISIT_ALERT_ALARM_PREFIX,
  HEARTBEAT_ALARM_NAME,
  handleAlertThresholdReached,
  handleHeartbeat,
} from "@background/sessionController";
import { runDetached } from "@background/runDetached";

export function registerAlarmListeners(): void {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name.startsWith(VISIT_ALERT_ALARM_PREFIX)) {
      runDetached(handleAlertThresholdReached(alarm.name));
      return;
    }
    if (alarm.name === HEARTBEAT_ALARM_NAME) {
      runDetached(handleHeartbeat());
    }
  });
}
