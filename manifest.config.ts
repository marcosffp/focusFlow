import { defineManifest } from "@crxjs/vite-plugin";
import packageJson from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: "FocusFlow",
  description:
    "Ajuda a perceber quando você saiu do foco durante uma sessão de trabalho ou estudo.",
  version: packageJson.version,
  icons: {
    16: "public/icons/icon-16.png",
    48: "public/icons/icon-48.png",
    128: "public/icons/icon-128.png",
  },
  action: {
    default_popup: "index.html",
    default_icon: {
      16: "public/icons/icon-16.png",
      48: "public/icons/icon-48.png",
      128: "public/icons/icon-128.png",
    },
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  // matches amplo (não só os 10 domínios default) porque a lista de distração é
  // editável pelo usuário (SOLUCAO.md 5.4/9) — ver ARQUITETURA.md seção 8.1.
  content_scripts: [
    {
      matches: ["http://*/*", "https://*/*"],
      js: ["src/content/distractionOverlay.ts"],
      run_at: "document_idle",
    },
  ],
  permissions: ["storage", "tabs", "alarms", "scripting"],
});
