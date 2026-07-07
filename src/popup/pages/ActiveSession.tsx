import type { JSX } from "react";
import type { Result } from "@shared-types/index";
import type { Session } from "@domain/types";
import { useElapsedTime } from "@popup/hooks/useElapsedTime";
import Timer from "@popup/components/Timer";
import PopupPage from "@popup/components/PopupPage";
import SectionLabel from "@popup/components/SectionLabel";
import Logo from "@popup/components/Logo";
import Button from "@popup/components/Button";
import Card from "@popup/components/Card";
import { logRejection } from "@utils/logRejection";

interface ActiveSessionProps {
  session: Session;
  endSession: () => Promise<Result<void>>;
}

export default function ActiveSession({ session, endSession }: ActiveSessionProps): JSX.Element {
  const { totalSeconds, focusedSeconds } = useElapsedTime(session);

  return (
    <PopupPage>
      <Logo />
      <div className="flex flex-col gap-1">
        <SectionLabel>Sessão em andamento</SectionLabel>
        <p className="text-sm text-slate-700 dark:text-slate-300">{session.objective.text}</p>
      </div>
      <Card className="flex gap-6">
        <Timer label="Tempo total" seconds={totalSeconds} />
        <Timer label="Tempo focado" seconds={focusedSeconds} />
      </Card>
      <Button onClick={() => logRejection(endSession())} className="w-full">
        Finalizar sessão
      </Button>
    </PopupPage>
  );
}
