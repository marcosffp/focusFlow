import{t as e}from"./sendMessage-k4toGxBv.js";var t=`focusflow-distraction-overlay-host`,n=`
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
`;function r(){let e=document.getElementById(t);if(e?.shadowRoot)return e.shadowRoot;let r=document.createElement(`div`);r.id=t,document.documentElement.appendChild(r);let i=r.attachShadow({mode:`open`}),a=document.createElement(`style`);return a.textContent=n,i.appendChild(a),i}function i(){r().querySelector(`.backdrop`)?.remove()}function a(e){i();let t=document.createElement(`div`);t.className=`backdrop`;let n=document.createElement(`div`);n.className=`card`,e(n),t.appendChild(n),r().appendChild(t)}function o(e){let t=document.createElement(`h1`);t.className=`headline`;let n=document.createElement(`span`);n.className=`icon`,n.textContent=`⚠️`;let r=document.createElement(`span`);return r.textContent=e,t.append(n,r),t}function s(){let e=document.createElement(`p`);e.className=`brand`;let t=document.createElement(`span`);t.className=`mark`;let n=document.createElement(`span`);return n.textContent=`FocusFlow`,e.append(t,n),e}function c(e,t){let n=document.createElement(`button`);return n.textContent=e,n.className=t,n}function l(t,n){a(r=>{let i=document.createElement(`p`);i.className=`message`,i.textContent=`Você entrou em ${n}. Isso faz parte do objetivo atual?`;let a=document.createElement(`div`);a.className=`actions`;let l=c(`Sim`,`primary`);l.addEventListener(`click`,()=>{e({type:`ANSWER_DISTRACTION`,eventId:t,answer:`yes`})});let u=c(`Não`,`secondary`);u.addEventListener(`click`,()=>{e({type:`ANSWER_DISTRACTION`,eventId:t,answer:`no`})}),a.append(l,u),r.append(o(`Saiu do foco?`),s(),i,a)})}function u(){a(t=>{let n=c(`Voltar ao trabalho`,`primary`);n.addEventListener(`click`,()=>{e({type:`RETURN_TO_WORK`})}),t.append(o(`Você saiu do foco`),s(),n)})}chrome.runtime.onMessage.addListener(e=>{switch(e.type){case`SHOW_ASK_OVERLAY`:l(e.eventId,e.domain);return;case`SHOW_LEFT_FOCUS_OVERLAY`:u();return;case`HIDE_OVERLAY`:i();return;default:throw Error(`mensagem de overlay não tratada: ${JSON.stringify(e)}`)}});