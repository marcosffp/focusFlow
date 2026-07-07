import type { OverlayMessage } from "@services/messaging/overlay";

interface FakeTab {
  id: number;
  url?: string;
  active: boolean;
  windowId: number;
  // Simula a aba já ter (ou não) o content script rodando. Abas de teste representam
  // navegação normal e por padrão já têm o script — passe `false` explicitamente para
  // simular uma aba que estava aberta antes da extensão carregar (ver overlay.ts).
  hasContentScript?: boolean;
}

interface FakeWindow {
  id: number;
  focused: boolean;
}

type TabActivatedListener = (activeInfo: { tabId: number; windowId: number }) => void;
type TabUpdatedListener = (tabId: number, changeInfo: { url?: string }, tab: FakeTab) => void;
type WindowFocusChangedListener = (windowId: number) => void;
type AlarmListener = (alarm: { name: string }) => void;

export interface FakeChromeBrowserController {
  tabs: Map<number, FakeTab>;
  windows: Map<number, FakeWindow>;
  scheduledAlarms: Map<string, { when?: number; periodInMinutes?: number }>;
  tabMessages: Map<number, OverlayMessage[]>;
  fireTabActivated(activeInfo: { tabId: number; windowId: number }): void;
  fireTabUpdated(tabId: number, changeInfo: { url?: string }): void;
  fireWindowFocusChanged(windowId: number): void;
  fireAlarm(name: string): void;
}

export function installFakeChromeBrowser(input: {
  tabs?: FakeTab[];
  windows?: FakeWindow[];
}): FakeChromeBrowserController {
  const tabs = new Map((input.tabs ?? []).map((tab) => [tab.id, tab]));
  const windows = new Map((input.windows ?? []).map((window) => [window.id, window]));
  const scheduledAlarms = new Map<string, { when?: number; periodInMinutes?: number }>();
  const tabMessages = new Map<number, OverlayMessage[]>();

  const tabActivatedListeners = new Set<TabActivatedListener>();
  const tabUpdatedListeners = new Set<TabUpdatedListener>();
  const windowFocusChangedListeners = new Set<WindowFocusChangedListener>();
  const alarmListeners = new Set<AlarmListener>();

  const tabsApi = {
    async get(tabId: number): Promise<FakeTab> {
      const tab = tabs.get(tabId);
      if (!tab) {
        throw new Error(`No tab with id: ${tabId}`);
      }
      return tab;
    },
    async update(tabId: number, updateProperties: { active?: boolean }): Promise<FakeTab> {
      const tab = tabs.get(tabId);
      if (!tab) {
        throw new Error(`No tab with id: ${tabId}`);
      }
      Object.assign(tab, updateProperties);
      return tab;
    },
    async create(): Promise<FakeTab> {
      const id = Math.max(0, ...Array.from(tabs.keys())) + 1;
      const newTab: FakeTab = { id, active: true, windowId: 1 };
      tabs.set(id, newTab);
      return newTab;
    },
    async query(queryInfo: { active?: boolean; windowId?: number }): Promise<FakeTab[]> {
      return Array.from(tabs.values()).filter(
        (tab) =>
          (queryInfo.active === undefined || tab.active === queryInfo.active) &&
          (queryInfo.windowId === undefined || tab.windowId === queryInfo.windowId),
      );
    },
    async sendMessage(tabId: number, message: OverlayMessage): Promise<void> {
      const tab = tabs.get(tabId);
      if (!tab) {
        throw new Error(`No tab with id: ${tabId}`);
      }
      if (tab.hasContentScript === false) {
        throw new Error("Could not establish connection. Receiving end does not exist.");
      }
      const messages = tabMessages.get(tabId) ?? [];
      messages.push(message);
      tabMessages.set(tabId, messages);
    },
    onActivated: {
      addListener(listener: TabActivatedListener): void {
        tabActivatedListeners.add(listener);
      },
    },
    onUpdated: {
      addListener(listener: TabUpdatedListener): void {
        tabUpdatedListeners.add(listener);
      },
    },
  };

  const windowsApi = {
    WINDOW_ID_NONE: -1,
    async get(windowId: number): Promise<FakeWindow> {
      const window = windows.get(windowId);
      if (!window) {
        throw new Error(`No window with id: ${windowId}`);
      }
      return window;
    },
    async update(windowId: number, updateProperties: { focused?: boolean }): Promise<FakeWindow> {
      const window = windows.get(windowId);
      if (!window) {
        throw new Error(`No window with id: ${windowId}`);
      }
      Object.assign(window, updateProperties);
      return window;
    },
    onFocusChanged: {
      addListener(listener: WindowFocusChangedListener): void {
        windowFocusChangedListeners.add(listener);
      },
    },
  };

  const alarmsApi = {
    async create(
      name: string,
      alarmInfo: { when?: number; periodInMinutes?: number },
    ): Promise<void> {
      scheduledAlarms.set(name, alarmInfo);
    },
    async clear(name: string): Promise<boolean> {
      return scheduledAlarms.delete(name);
    },
    onAlarm: {
      addListener(listener: AlarmListener): void {
        alarmListeners.add(listener);
      },
    },
  };

  const runtimeApi = {
    getURL(path: string): string {
      return `chrome-extension://fake-extension-id/${path}`;
    },
    getManifest(): { content_scripts: { js: string[] }[] } {
      return { content_scripts: [{ js: ["src/content/distractionOverlay.ts"] }] };
    },
  };

  const scriptingApi = {
    async executeScript(details: { target: { tabId: number }; files: string[] }): Promise<void> {
      const tab = tabs.get(details.target.tabId);
      if (!tab) {
        throw new Error(`No tab with id: ${details.target.tabId}`);
      }
      tab.hasContentScript = true;
    },
  };

  globalThis.chrome = {
    ...(globalThis.chrome as object | undefined),
    tabs: tabsApi,
    windows: windowsApi,
    alarms: alarmsApi,
    scripting: scriptingApi,
    runtime: { ...(globalThis.chrome?.runtime as object | undefined), ...runtimeApi },
  } as unknown as typeof chrome;

  return {
    tabs,
    windows,
    scheduledAlarms,
    tabMessages,
    fireTabActivated(activeInfo): void {
      tabActivatedListeners.forEach((listener) => listener(activeInfo));
    },
    fireTabUpdated(tabId, changeInfo): void {
      const tab = tabs.get(tabId);
      if (!tab) {
        throw new Error(`No tab with id: ${tabId}`);
      }
      tabUpdatedListeners.forEach((listener) => listener(tabId, changeInfo, tab));
    },
    fireWindowFocusChanged(windowId): void {
      windowFocusChangedListeners.forEach((listener) => listener(windowId));
    },
    fireAlarm(name): void {
      alarmListeners.forEach((listener) => listener({ name }));
    },
  };
}
