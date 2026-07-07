import { useState } from "react";
import type { JSX } from "react";
import type { Result } from "@shared-types/index";
import { MAX_OBJECTIVE_LENGTH } from "@domain/types";
import { logRejection } from "@utils/logRejection";
import PopupPage from "@popup/components/PopupPage";
import Logo from "@popup/components/Logo";
import Button from "@popup/components/Button";
import TextInput from "@popup/components/TextInput";

interface HomeProps {
  startSession: (objective: string) => Promise<Result<void>>;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
}

export default function Home({
  startSession,
  onOpenHistory,
  onOpenSettings,
}: HomeProps): JSX.Element {
  const [objective, setObjective] = useState("");

  const isStartDisabled = objective.trim().length === 0;

  const handleStart = (): void => {
    logRejection(startSession(objective));
  };

  const iconButtonClassName =
    "inline-flex items-center justify-center rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-white/10";

  return (
    <PopupPage>
      <div className="flex items-center justify-between">
        <Logo />
        <div className="flex gap-1">
          <Button
            variant="ghost"
            onClick={onOpenHistory}
            aria-label="Histórico"
            title="Histórico"
            className={iconButtonClassName}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-[18px]"
              aria-hidden="true"
            >
              <path d="M3 12a9 9 0 1 0 3-6.7" />
              <path d="M3 4v5h5" />
              <path d="M12 8v4l3 3" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            onClick={onOpenSettings}
            aria-label="Configurações"
            title="Configurações"
            className={iconButtonClassName}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="size-[18px]"
              aria-hidden="true"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <circle cx="15" cy="6" r="2" fill="currentColor" stroke="none" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <circle cx="9" cy="12" r="2" fill="currentColor" stroke="none" />
              <line x1="4" y1="18" x2="20" y2="18" />
              <circle cx="16" cy="18" r="2" fill="currentColor" stroke="none" />
            </svg>
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="objective" className="text-sm text-slate-600 dark:text-slate-300">
          Qual é o objetivo desta sessão?
        </label>
        <TextInput
          id="objective"
          type="text"
          value={objective}
          onChange={(event) => setObjective(event.target.value)}
          maxLength={MAX_OBJECTIVE_LENGTH}
          placeholder="ex.: terminar o relatório de vendas"
        />
      </div>
      <Button onClick={handleStart} disabled={isStartDisabled} className="w-full">
        Iniciar sessão
      </Button>
    </PopupPage>
  );
}
