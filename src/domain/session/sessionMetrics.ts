import type { DistractionEvent, Session, SessionReport } from "@domain/types";
import { classifyDomainTime } from "@domain/session/timeClassification";
import { calculateFocusScore } from "@domain/session/scoring";

const MAX_TOP_DOMAINS = 5;

export interface ElapsedTime {
  readonly totalSeconds: number;
  readonly focusedSeconds: number;
  readonly distractedSeconds: number;
}

interface EventDurationClassification {
  readonly visitDurationSeconds: number;
  readonly isDistracted: boolean;
}

function classifyEventDuration(
  event: DistractionEvent,
  referenceTime: number,
  minAlertSeconds: number,
  isVisitOngoing: boolean,
): EventDurationClassification {
  const visitDurationSeconds = ((event.leftAt ?? referenceTime) - event.enteredAt) / 1000;
  const classification = classifyDomainTime({
    isDistractionDomain: true,
    answer: event.answer,
    visitDurationSeconds,
    minAlertSeconds,
    isVisitOngoing,
  });
  return { visitDurationSeconds, isDistracted: classification === "distracted" };
}

export function calculateElapsedTime(
  session: Session,
  now: number,
  minAlertSeconds: number,
): ElapsedTime {
  const totalSeconds = (now - session.startedAt) / 1000;

  const distractedSeconds = session.distractionEvents.reduce((sum, event) => {
    const { visitDurationSeconds, isDistracted } = classifyEventDuration(
      event,
      now,
      minAlertSeconds,
      event.leftAt === null,
    );
    // "neutral" (visita em andamento aguardando resposta do usuário) fica de fora da
    // soma de distraído de propósito: SOLUCAO.md 6.3 trata esse tempo como provisório,
    // só reclassificado quando o usuário responde ou a visita termina. Para o relógio
    // ao vivo, isso cai no restante (focado) por residual — não é penalizado antes de
    // uma confirmação, igual à regra descrita no documento.
    return isDistracted ? sum + visitDurationSeconds : sum;
  }, 0);

  return {
    totalSeconds,
    distractedSeconds,
    focusedSeconds: totalSeconds - distractedSeconds,
  };
}

export function computeSessionReport(
  session: Session,
  input: { endedAt: number; minAlertSeconds: number },
): SessionReport {
  const totalSeconds = (input.endedAt - session.startedAt) / 1000;
  const domainSeconds = new Map<string, number>();
  let distractedSeconds = 0;
  let confirmedDistractionCount = 0;

  for (const event of session.distractionEvents) {
    // A sessão já terminou (endSession fecha a última visita antes de chamar isto),
    // então nenhum evento está mais em andamento.
    const { visitDurationSeconds, isDistracted } = classifyEventDuration(
      event,
      input.endedAt,
      input.minAlertSeconds,
      false,
    );
    domainSeconds.set(event.domain, (domainSeconds.get(event.domain) ?? 0) + visitDurationSeconds);

    if (event.answer === "no") {
      confirmedDistractionCount += 1;
    }
    if (isDistracted) {
      distractedSeconds += visitDurationSeconds;
    }
  }

  const topDomains = Array.from(domainSeconds.entries())
    .map(([domain, seconds]) => ({ domain, seconds }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, MAX_TOP_DOMAINS);

  return {
    totalSeconds,
    distractedSeconds,
    focusedSeconds: totalSeconds - distractedSeconds,
    confirmedDistractionCount,
    topDomains,
    score: calculateFocusScore({ confirmedDistractionCount, distractedSeconds }),
  };
}
