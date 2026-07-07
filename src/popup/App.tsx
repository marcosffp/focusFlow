import { useState } from "react";
import type { JSX } from "react";
import Home from "@popup/pages/Home";
import ActiveSession from "@popup/pages/ActiveSession";
import Report from "@popup/pages/Report";
import History from "@popup/pages/History";
import Settings from "@popup/pages/Settings";
import { useSessionState } from "@popup/hooks/useSessionState";
import { useHistory } from "@popup/hooks/useHistory";
import { useSettings } from "@popup/hooks/useSettings";
import { useDistractionSites } from "@popup/hooks/useDistractionSites";

type IdleView = "home" | "history" | "settings";

export default function App(): JSX.Element | null {
  const { state, startSession, endSession, dismissReport } = useSessionState();
  const { entries } = useHistory();
  const { settings, updateSettings } = useSettings();
  const { sites, addSite, removeSite } = useDistractionSites();
  const [idleView, setIdleView] = useState<IdleView>("home");

  if (state === null) {
    return null;
  }

  switch (state.status) {
    case "idle":
      if (idleView === "history") {
        return <History entries={entries ?? []} onBack={() => setIdleView("home")} />;
      }
      if (idleView === "settings") {
        if (settings === null || sites === null) {
          return null;
        }
        return (
          <Settings
            settings={settings}
            sites={sites}
            onBack={() => setIdleView("home")}
            updateSettings={updateSettings}
            addSite={addSite}
            removeSite={removeSite}
          />
        );
      }
      return (
        <Home
          startSession={startSession}
          onOpenHistory={() => setIdleView("history")}
          onOpenSettings={() => setIdleView("settings")}
        />
      );
    case "active":
      return <ActiveSession session={state.session} endSession={endSession} />;
    case "finished":
      return <Report session={state.session} report={state.report} dismissReport={dismissReport} />;
    default: {
      const exhaustiveCheck: never = state;
      throw new Error(`estado de sessão não tratado: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
}
