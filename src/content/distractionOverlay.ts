import { sendMessage } from "@services/messaging/sendMessage";
import type { OverlayMessage } from "@services/messaging/overlay";

const HOST_ID = "focusflow-distraction-overlay-host";

// Shadow DOM isolado: a página (ex.: CSS global do YouTube) nunca deve conseguir
// alterar a aparência do overlay, nem o inverso.
const STYLES = `
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    animation: ff-backdrop-in 200ms ease-out forwards;
  }
  .card {
    background: #ffffff;
    color: #0f172a;
    border-radius: 24px;
    padding: 40px;
    width: min(90vw, 460px);
    box-shadow: 0 25px 70px rgba(0, 0, 0, 0.5);
    text-align: center;
    opacity: 0;
    animation: ff-card-in 360ms cubic-bezier(0.34, 1.56, 0.64, 1) 60ms forwards;
  }
  @media (prefers-color-scheme: dark) {
    .card {
      background: #171a2e;
      color: #f8fafc;
    }
    .secondary {
      background: #262b47;
      color: #f8fafc;
    }
  }
  .headline {
    margin: 0 0 6px;
    font-size: 28px;
    font-weight: 800;
    color: #dc2626;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .headline .icon {
    display: inline-block;
    animation: ff-pulse 1.1s ease-in-out infinite;
  }
  .brand {
    margin: 0 0 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #94a3b8;
  }
  .brand .mark {
    display: inline-flex;
    width: 16px;
    height: 16px;
    border-radius: 5px;
    background: linear-gradient(135deg, #6366f1, #4338ca);
  }
  .message {
    margin: 0 0 28px;
    font-size: 18px;
    line-height: 1.4;
  }
  .actions {
    display: flex;
    justify-content: center;
  }
  button {
    border: none;
    border-radius: 12px;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    margin: 8px;
    font-family: inherit;
    transition: transform 120ms ease, filter 120ms ease;
  }
  button:hover {
    transform: translateY(-2px);
    filter: brightness(1.1);
  }
  button:active {
    transform: translateY(0);
    filter: brightness(0.95);
  }
  .primary {
    background: linear-gradient(135deg, #6366f1, #4338ca);
    color: #fff;
  }
  .secondary {
    background: #e2e8f0;
    color: #0f172a;
  }
  @keyframes ff-backdrop-in {
    from { background: rgba(15, 23, 42, 0); }
    to { background: rgba(15, 23, 42, 0.75); }
  }
  @keyframes ff-card-in {
    from { opacity: 0; transform: scale(0.85) translateY(16px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes ff-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
  }
`;

function getShadowRoot(): ShadowRoot {
  const existingHost = document.getElementById(HOST_ID);
  if (existingHost?.shadowRoot) {
    return existingHost.shadowRoot;
  }

  const host = document.createElement("div");
  host.id = HOST_ID;
  document.documentElement.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = STYLES;
  shadowRoot.appendChild(style);
  return shadowRoot;
}

function removeOverlay(): void {
  getShadowRoot().querySelector(".backdrop")?.remove();
}

function renderOverlay(build: (card: HTMLDivElement) => void): void {
  removeOverlay();

  const backdrop = document.createElement("div");
  backdrop.className = "backdrop";

  const card = document.createElement("div");
  card.className = "card";
  build(card);

  backdrop.appendChild(card);
  getShadowRoot().appendChild(backdrop);
}

function createHeadline(text: string): HTMLHeadingElement {
  const headline = document.createElement("h1");
  headline.className = "headline";
  const icon = document.createElement("span");
  icon.className = "icon";
  icon.textContent = "⚠️";
  const label = document.createElement("span");
  label.textContent = text;
  headline.append(icon, label);
  return headline;
}

function createBrandLabel(): HTMLParagraphElement {
  const brand = document.createElement("p");
  brand.className = "brand";
  const mark = document.createElement("span");
  mark.className = "mark";
  const label = document.createElement("span");
  label.textContent = "FocusFlow";
  brand.append(mark, label);
  return brand;
}

function createButton(label: string, variant: "primary" | "secondary"): HTMLButtonElement {
  const button = document.createElement("button");
  button.textContent = label;
  button.className = variant;
  return button;
}

function showAskOverlay(eventId: string, domain: string): void {
  renderOverlay((card) => {
    const message = document.createElement("p");
    message.className = "message";
    message.textContent = `Você entrou em ${domain}. Isso faz parte do objetivo atual?`;

    const actions = document.createElement("div");
    actions.className = "actions";
    const yesButton = createButton("Sim", "primary");
    yesButton.addEventListener("click", () => {
      void sendMessage({ type: "ANSWER_DISTRACTION", eventId, answer: "yes" });
    });
    const noButton = createButton("Não", "secondary");
    noButton.addEventListener("click", () => {
      void sendMessage({ type: "ANSWER_DISTRACTION", eventId, answer: "no" });
    });
    actions.append(yesButton, noButton);

    card.append(createHeadline("Saiu do foco?"), createBrandLabel(), message, actions);
  });
}

function showLeftFocusOverlay(): void {
  renderOverlay((card) => {
    const returnButton = createButton("Voltar ao trabalho", "primary");
    returnButton.addEventListener("click", () => {
      void sendMessage({ type: "RETURN_TO_WORK" });
    });

    card.append(createHeadline("Você saiu do foco"), createBrandLabel(), returnButton);
  });
}

// O content script nunca decide sozinho se algo é distração: ele só renderiza o que o
// background manda (PADRAO_DE_CODIGO.md seção 5, mesmo princípio do popup "burro").
chrome.runtime.onMessage.addListener((message: OverlayMessage) => {
  switch (message.type) {
    case "SHOW_ASK_OVERLAY":
      showAskOverlay(message.eventId, message.domain);
      return;
    case "SHOW_LEFT_FOCUS_OVERLAY":
      showLeftFocusOverlay();
      return;
    case "HIDE_OVERLAY":
      removeOverlay();
      return;
    default: {
      const exhaustiveCheck: never = message;
      throw new Error(`mensagem de overlay não tratada: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
});
