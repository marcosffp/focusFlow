import type { Result } from "@shared-types/index";
import type { Message } from "@services/messaging/messages";
import {
  startSession,
  endSession,
  dismissReport,
  answerDistraction,
  returnToWork,
} from "@background/sessionController";

export function routeMessage(message: Message): Promise<Result<void>> {
  switch (message.type) {
    case "START_SESSION":
      return startSession(message.objective);
    case "END_SESSION":
      return endSession();
    case "DISMISS_REPORT":
      return dismissReport();
    case "ANSWER_DISTRACTION":
      return answerDistraction(message.eventId, message.answer);
    case "RETURN_TO_WORK":
      return returnToWork().then(() => ({ ok: true, value: undefined }));
    default: {
      const exhaustiveCheck: never = message;
      throw new Error(`mensagem não tratada: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
}
