import { useState } from "react";
import type { JSX } from "react";
import type { DistractionSite, Settings as SettingsType } from "@domain/types";
import {
  MIN_ALERT_SECONDS_LOWER_BOUND,
  MIN_ALERT_SECONDS_UPPER_BOUND,
} from "@popup/hooks/useSettings";
import { logRejection } from "@utils/logRejection";
import PopupPage from "@popup/components/PopupPage";
import SectionLabel from "@popup/components/SectionLabel";
import Logo from "@popup/components/Logo";
import Button from "@popup/components/Button";
import TextInput from "@popup/components/TextInput";
import Card from "@popup/components/Card";

interface SettingsProps {
  settings: SettingsType;
  sites: readonly DistractionSite[];
  onBack: () => void;
  updateSettings: (partial: Partial<SettingsType>) => Promise<void>;
  addSite: (domain: string) => Promise<void>;
  removeSite: (domain: string) => Promise<void>;
}

export default function Settings({
  settings,
  sites,
  onBack,
  updateSettings,
  addSite,
  removeSite,
}: SettingsProps): JSX.Element {
  const [newDomain, setNewDomain] = useState("");

  const handleAddSite = (): void => {
    // addSite já normaliza e ignora domínio vazio/duplicado — não repetimos a validação aqui.
    logRejection(addSite(newDomain));
    setNewDomain("");
  };

  const handleMinAlertSecondsChange = (value: string): void => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }
    const clamped = Math.min(
      MIN_ALERT_SECONDS_UPPER_BOUND,
      Math.max(MIN_ALERT_SECONDS_LOWER_BOUND, Math.round(parsed)),
    );
    logRejection(updateSettings({ minAlertSeconds: clamped }));
  };

  return (
    <PopupPage>
      <div className="flex items-center justify-between">
        <Logo />
        <Button variant="ghost" onClick={onBack}>
          Voltar
        </Button>
      </div>

      <Card className="flex flex-col gap-3">
        <label className="flex items-center justify-between text-sm text-slate-700 dark:text-slate-300">
          Notificações ativadas
          <input
            type="checkbox"
            checked={settings.notificationsEnabled}
            onChange={(event) =>
              logRejection(updateSettings({ notificationsEnabled: event.target.checked }))
            }
            className="size-4 accent-indigo-600"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-slate-700 dark:text-slate-300">
          Tempo mínimo para alerta (segundos)
          <TextInput
            type="number"
            min={MIN_ALERT_SECONDS_LOWER_BOUND}
            max={MIN_ALERT_SECONDS_UPPER_BOUND}
            value={settings.minAlertSeconds}
            onChange={(event) => handleMinAlertSecondsChange(event.target.value)}
          />
        </label>
      </Card>

      <div className="flex flex-col gap-2">
        <SectionLabel>Sites de distração</SectionLabel>
        <ul className="flex flex-col gap-1">
          {sites.map((site) => (
            <li
              key={site.domain}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm text-slate-700 dark:bg-surface-dark-elevated dark:text-slate-300"
            >
              <span>{site.domain}</span>
              <Button variant="ghost" onClick={() => logRejection(removeSite(site.domain))}>
                Remover
              </Button>
            </li>
          ))}
        </ul>

        <div className="mt-1 flex gap-2">
          <TextInput
            type="text"
            value={newDomain}
            onChange={(event) => setNewDomain(event.target.value)}
            placeholder="ex.: pinterest.com"
            className="flex-1"
          />
          <Button onClick={handleAddSite}>Adicionar</Button>
        </div>
      </div>
    </PopupPage>
  );
}
