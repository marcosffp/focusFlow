import type { Result } from "@shared-types/index";
import type { Message } from "@services/messaging/messages";

export function sendMessage(message: Message): Promise<Result<void>> {
  return chrome.runtime.sendMessage(message);
}
