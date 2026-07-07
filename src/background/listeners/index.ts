import { registerTabListeners } from "@background/listeners/tabs";
import { registerWindowListeners } from "@background/listeners/windows";
import { registerAlarmListeners } from "@background/listeners/alarms";

export function registerBackgroundListeners(): void {
  registerTabListeners();
  registerWindowListeners();
  registerAlarmListeners();
}
