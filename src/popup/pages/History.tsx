import { useState } from "react";
import type { JSX } from "react";
import type { HistoryEntry } from "@domain/types";
import { formatDuration } from "@utils/formatDuration";
import { formatDate } from "@utils/formatDate";
import PopupPage from "@popup/components/PopupPage";
import SectionLabel from "@popup/components/SectionLabel";
import TopDomainsList from "@popup/components/TopDomainsList";
import Logo from "@popup/components/Logo";
import Button from "@popup/components/Button";
import Card from "@popup/components/Card";

interface HistoryProps {
  entries: readonly HistoryEntry[];
  onBack: () => void;
}

export default function History({ entries, onBack }: HistoryProps): JSX.Element {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  return (
    <PopupPage>
      <div className="flex items-center justify-between">
        <Logo />
        <Button variant="ghost" onClick={onBack}>
          Voltar
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Nenhuma sessão finalizada ainda.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => {
            const isExpanded = expandedSessionId === entry.session.id;
            return (
              <Card as="li" key={entry.session.id} className="p-3">
                <button
                  type="button"
                  onClick={() => setExpandedSessionId(isExpanded ? null : entry.session.id)}
                  className="flex w-full flex-col gap-1 text-left"
                >
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {entry.session.objective.text}
                  </span>
                  <span className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{formatDate(entry.session.startedAt)}</span>
                    <span>
                      {formatDuration(entry.report.totalSeconds)} · pontuação {entry.report.score}
                    </span>
                  </span>
                </button>

                {isExpanded && (
                  <div className="mt-2 flex flex-col gap-1 border-t border-slate-200 pt-2 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300">
                    <p>Tempo focado: {formatDuration(entry.report.focusedSeconds)}</p>
                    <p>Tempo distraído: {formatDuration(entry.report.distractedSeconds)}</p>
                    <p>Distrações confirmadas: {entry.report.confirmedDistractionCount}</p>
                    <div>
                      <SectionLabel>Sites mais acessados</SectionLabel>
                      <TopDomainsList
                        domains={entry.report.topDomains}
                        emptyMessage="Nenhum site de distração acessado."
                      />
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </ul>
      )}
    </PopupPage>
  );
}
