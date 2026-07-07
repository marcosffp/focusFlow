import type { JSX } from "react";
import type { Result } from "@shared-types/index";
import type { Session, SessionReport } from "@domain/types";
import { logRejection } from "@utils/logRejection";
import Timer from "@popup/components/Timer";
import PopupPage from "@popup/components/PopupPage";
import SectionLabel from "@popup/components/SectionLabel";
import TopDomainsList from "@popup/components/TopDomainsList";
import Logo from "@popup/components/Logo";
import Button from "@popup/components/Button";
import Card from "@popup/components/Card";

interface ReportProps {
  session: Session;
  report: SessionReport;
  dismissReport: () => Promise<Result<void>>;
}

export default function Report({ session, report, dismissReport }: ReportProps): JSX.Element {
  return (
    <PopupPage>
      <Logo />
      <div className="flex flex-col gap-1">
        <SectionLabel>Sessão finalizada</SectionLabel>
        <p className="text-sm text-slate-700 dark:text-slate-300">{session.objective.text}</p>
      </div>

      <div className="flex flex-col items-center gap-1 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 py-5 text-white">
        <SectionLabel tone="light">Pontuação de foco</SectionLabel>
        <span className="text-4xl font-bold">{Math.round(report.score)}</span>
      </div>

      <Card className="flex justify-between gap-2">
        <Timer label="Tempo total" seconds={report.totalSeconds} />
        <Timer label="Tempo focado" seconds={report.focusedSeconds} />
        <Timer label="Tempo distraído" seconds={report.distractedSeconds} />
      </Card>

      <p className="text-sm text-slate-700 dark:text-slate-300">
        Distrações confirmadas:{" "}
        <span className="font-semibold text-slate-900 dark:text-white">
          {report.confirmedDistractionCount}
        </span>
      </p>

      <div>
        <SectionLabel>Sites mais acessados</SectionLabel>
        <TopDomainsList
          domains={report.topDomains}
          emptyMessage="Nenhum site de distração acessado."
        />
      </div>

      <Button onClick={() => logRejection(dismissReport())} className="w-full">
        Nova sessão
      </Button>
    </PopupPage>
  );
}
