<img width="1600" style="height:auto; border-radius: 12px;" alt="banner" src="images/banner.png" />

# FocusFlow — Regras de Negócio e Histórias de Usuário

> **Este documento é a fonte única de verdade sobre o que o FocusFlow é, o que não é, e como cada regra de negócio deve se comportar.** Qualquer decisão de implementação, arquitetura ou funcionalidade deve ser validada contra este documento antes de ser tomada. Se uma ideia não está descrita aqui como "dentro do escopo", ela **não deve** ser implementada sem antes atualizar este documento. Para a arquitetura técnica que sustenta estas regras, ver `docs/arquitetura_diagramas.md`.

---

## 1. Visão geral do produto

FocusFlow é uma **extensão de navegador (Chromium / Manifest V3)** que ajuda o usuário a perceber, em tempo real, quando ele se desviou do objetivo que definiu para uma sessão de trabalho ou estudo.

O produto atua em três momentos:

1. **Antes** — o usuário declara um objetivo curto e explícito para a sessão.
2. **Durante** — a extensão observa trocas de aba e domínio, e quando identifica acesso a um site classificado como distração, pergunta ao usuário se aquilo faz parte do objetivo.
3. **Depois** — a extensão apresenta um relatório objetivo (tempo focado, tempo distraído, pontuação) e guarda o histórico localmente.

O mecanismo central do produto é a **pergunta de confirmação consciente** ("Isso faz parte do objetivo atual?"). Esse é o coração do produto — tudo mais existe para sustentar esse momento.

### 1.1 Princípios do produto

- **Consciência, não bloqueio.** A extensão nunca impede o usuário de acessar um site. Ela só pergunta.
- **Fricção mínima.** Qualquer interação exigida do usuário deve ser resolvível em 1 clique.
- **Sem julgamento.** As mensagens da extensão são neutras e informativas, nunca de tom repreensivo ou culpabilizador.
- **100% local.** Nenhum dado sai do navegador do usuário. Não há login, não há backend, não há telemetria enviada a servidores externos.
- **Regras simples e determinísticas.** Não existe IA, heurística difusa ou machine learning. Toda decisão é baseada em: lista de domínios + tempo + resposta do usuário.

---

## 2. Escopo — o que o FocusFlow **não é**

Esta seção existe para evitar que a implementação "vaze" para caminhos não pedidos. Se uma tarefa futura parecer se encaixar em um destes itens, ela deve ser tratada como um épico separado, e este documento deve ser atualizado antes de qualquer código ser escrito.

- ❌ **Não é um bloqueador de sites.** Não existe funcionalidade de impedir, redirecionar à força ou fechar abas automaticamente. O botão "Voltar ao trabalho" é uma ação *sugerida e clicada pelo usuário*, nunca automática.
- ❌ **Não é um Pomodoro.** Não há ciclos de trabalho/descanso automatizados.
- ❌ **Não usa Inteligência Artificial.** Nenhuma classificação de conteúdo, título de página, NLP ou modelo de linguagem é usada para decidir se algo é distração. A arquitetura já prevê um ponto de extensão para isso (ver `docs/arquitetura_diagramas.md` seção 11), mas nada disso está ativo hoje.
- ❌ **Não tem backend, conta de usuário ou sincronização entre dispositivos.** Tudo é `chrome.storage.local`.
- ❌ **Não analisa o conteúdo das páginas.** A extensão olha apenas para o **domínio** da URL e o **tempo** gasto nele — nunca para o texto, título ou conteúdo semântico da página.
- ❌ **Não bloqueia nem monitora abas anônimas (modo incógnito)**, a menos que o usuário habilite explicitamente a permissão (fora do escopo padrão).
- ❌ **Não envia notificações push de terceiros, e-mails ou mensagens.** O único mecanismo de alerta é o overlay renderizado na própria página pelo content script (ver seção 5, Épico 4).
- ❌ **Não faz gamificação avançada** (conquistas, streaks, ranking).
- ❌ **Não tem modo escuro, exportação/importação de configurações.**
- ❌ **Não impõe múltiplos objetivos simultâneos.** Existe **um único objetivo ativo por sessão**.
- ❌ **Não gerencia múltiplas sessões em paralelo.** Só pode haver **uma sessão ativa por vez** no navegador (mesmo com múltiplas janelas).

---

## 3. Glossário

| Termo | Definição |
|---|---|
| **Sessão** | Período de tempo, delimitado por "Iniciar sessão" e "Finalizar sessão", associado a um único objetivo. |
| **Objetivo** | Texto curto definido pelo usuário antes de iniciar a sessão, descrevendo a tarefa a ser feita. |
| **Domínio de distração** | Domínio presente na lista configurável (ex.: `youtube.com`). |
| **Distração confirmada** | Acesso a um domínio de distração em que o usuário respondeu "Não" (não faz parte do objetivo). |
| **Distração ignorada (permitida)** | Acesso a um domínio de distração em que o usuário respondeu "Sim" (faz parte do objetivo). |
| **Aba produtiva** | Última aba/domínio em que o usuário estava **antes** de entrar em um domínio de distração, dentro da sessão ativa. |
| **Tempo focado** | Tempo total da sessão menos o tempo computado como distração confirmada. |
| **Tempo distraído** | Soma do tempo gasto em domínios de distração após uma resposta "Não" (ou sem resposta — ver seção 6). |
| **Pontuação de foco** | Métrica de 0 a 100 calculada ao final da sessão (ver seção 7). |

---

## 4. Persona e contexto de uso

Uma única persona cobre o produto inteiro: desenvolvedores, estudantes, designers, remotos — pessoas que passam a maior parte do tempo de trabalho **dentro do navegador**. O usuário já sabe, no momento em que abre a extensão, **o que precisa fazer** — o problema não é falta de plano, é perda de rumo no meio da execução (o "efeito YouTube → recomendado → Discord → Reddit → 40 minutos depois"). O uso é solo, individual, sem qualquer dimensão colaborativa ou social.

---

## 5. Histórias de usuário

Cada história segue o formato **Como / Quero / Para que**, seguida de critérios de aceite objetivos (testáveis) e de um rótulo de status:

- ✅ **Implementado** — código existe e tem teste automatizado cobrindo a regra.
- ⚠️ **Implementado, validação manual pendente** — código existe, mas depende de um teste manual em Chrome real para ser considerado 100% fechado (cronometragem de UX ponta a ponta e medição de performance do popup).

As histórias estão agrupadas em 8 épicos, na mesma ordem em que o produto é vivido pelo usuário.

### Épico 1 — Definir objetivo e iniciar sessão

**Regras de negócio:**
- Campo de texto obrigatório para o objetivo, sem validação semântica (é texto livre — não se avalia se "faz sentido").
- Sem limite mínimo de caracteres; limite máximo de 140 caracteres, para manter o objetivo curto e visível no cronômetro.
- O botão "Iniciar sessão" fica desabilitado se o campo estiver vazio ou contiver apenas espaços em branco.
- Ao iniciar: o objetivo é salvo como ativo, a sessão é criada com `startedAt = now()`, e o estado global muda para **sessão ativa**.
- **Regra da aba já ativa ao iniciar a sessão:** a aba que já está ativa e em foco no momento do clique deve ser avaliada imediatamente (mesmo prazo de "tempo mínimo para alerta" contado a partir do início da sessão, não do momento em que o usuário entrou nela) — sem essa checagem inicial, se o usuário já estivesse em um domínio de distração antes de iniciar a sessão e não trocasse de aba depois, a extensão nunca perceberia essa distração.
- **Regra de unicidade:** só pode existir uma sessão ativa por vez em todo o navegador (não por janela/aba). Se o usuário abrir o popup em outra janela durante uma sessão ativa, ele deve ver o estado de "sessão ativa", nunca a tela inicial de criação de objetivo.

#### US-01 — Declarar o objetivo da sessão
**Como** usuário que vai começar a trabalhar ou estudar,
**quero** escrever em uma frase curta o que pretendo fazer,
**para que** a extensão saiba contra o que comparar minhas distrações durante a sessão.

**Critérios de aceite:**
- O campo de objetivo é texto livre, sem validação semântica.
- Limite máximo de 140 caracteres, sem mínimo de caracteres.
- Um objetivo em branco ou só com espaços não pode ser salvo.

**Status:** ✅ Implementado — `src/popup/pages/home.tsx`, `src/domain/types.ts`.

#### US-02 — Iniciar a sessão com um clique
**Como** usuário que já escreveu o objetivo,
**quero** clicar em "Iniciar sessão",
**para que** o cronômetro e o monitoramento comecem imediatamente, sem passos extras.

**Critérios de aceite:**
- O botão "Iniciar sessão" fica desabilitado enquanto o objetivo estiver vazio.
- Ao clicar, a sessão é criada com `startedAt = now()` e o estado global muda para `active`.
- A aba que já estava ativa no momento do clique é avaliada imediatamente quanto à distração — não é preciso trocar de aba para a extensão perceber que já se estava em um site de distração.

**Status:** ✅ Implementado — `src/background/sessioncontroller.ts` (`startSession`, `getFocusedActiveTab`).

#### US-03 — Impedir duas sessões simultâneas
**Como** usuário que abre o popup em mais de uma janela do Chrome,
**quero** ver sempre a mesma sessão ativa, nunca a tela de criação de um novo objetivo,
**para que** eu nunca acidentalmente crie objetivos conflitantes ou perca o controle de qual sessão está valendo.

**Critérios de aceite:**
- Só existe uma sessão ativa por vez em todo o navegador.
- Abrir o popup durante uma sessão ativa mostra a tela de Sessão Ativa, nunca a Home.

**Status:** ✅ Implementado — `src/background/sessioncontroller.ts` + `src/domain/session/sessionmachine.ts` (transição só permitida a partir de `idle`).

### Épico 2 — Sessão ativa e cronômetro

**Regras de negócio:**
- A tela de sessão ativa exibe: objetivo atual, cronômetro (tempo total decorrido), status ("Sessão em andamento"), e tempo focado.
- O cronômetro continua rodando mesmo com o popup fechado — a contagem de tempo/monitoramento vive no **service worker (background)**, não no popup. O popup é apenas uma "janela" para visualizar o estado.
- **Pausar sessão está fora de escopo.** Existe apenas "iniciar" e "finalizar".
- Se o Chrome fechar/crashar com uma sessão ativa, ao reabrir o navegador a sessão deve ser **restaurada automaticamente** a partir do `chrome.storage.local`. O cronômetro reflete o tempo real decorrido, baseado em timestamps, nunca em contadores em memória que zeram ao reiniciar.
- Não existe encerramento automático por inatividade/timeout — a sessão só termina quando o usuário clica em "Finalizar sessão". Decisão deliberada de simplicidade.

#### US-04 — Ver o tempo passando em tempo real
**Como** usuário em sessão ativa,
**quero** ver um cronômetro de tempo total e de tempo focado sempre atualizado,
**para que** eu tenha consciência de quanto tempo já dediquei à tarefa, mesmo sem abrir o relatório final.

**Critérios de aceite:**
- A tela de Sessão Ativa mostra objetivo, tempo total e tempo focado.
- Os valores atualizam sem a necessidade de fechar e reabrir o popup (via `chrome.storage.onChanged`, sem polling).
- O cronômetro continua correto mesmo que o popup fique fechado por um tempo e seja reaberto depois — o tempo é sempre recalculado a partir de timestamps salvos, nunca de um contador em memória.

**Status:** ✅ Implementado — `src/popup/pages/activesession.tsx`, `src/popup/hooks/useelapsedtime.ts`.

#### US-05 — Encerrar a sessão a qualquer momento
**Como** usuário em sessão ativa,
**quero** um botão "Finalizar sessão" sempre disponível,
**para que** eu decida quando a sessão termina, sem depender de timers automáticos ou timeouts.

**Critérios de aceite:**
- O botão está visível durante toda a sessão ativa.
- Não existe encerramento automático por inatividade.

**Status:** ✅ Implementado — `src/popup/pages/activesession.tsx`.

### Épico 3 — Monitoramento de abas e detecção de distração

**Regras de negócio:**
- O monitoramento observa exclusivamente: (1) troca da aba ativa, (2) mudança de URL/domínio dentro da aba ativa, (3) tempo decorrido em cada domínio, calculado pela diferença de timestamps entre eventos.
- Só a **aba atualmente ativa e em foco** na janela do Chrome que está em foco é avaliada. Abas de distração abertas em segundo plano **não disparam** o alerta — só disparam quando o usuário efetivamente troca para elas.
- Múltiplas janelas do Chrome: o monitoramento segue a aba ativa da janela que está com foco do sistema operacional.
- Lista inicial de domínios de distração (default, editável nas Configurações): `youtube.com`, `instagram.com`, `reddit.com`, `x.com`, `twitter.com`, `facebook.com`, `discord.com`, `tiktok.com`, `netflix.com`, `twitch.tv`.
- **Regra de correspondência:** o match é feito pelo domínio raiz (eTLD+1) e cobre subdomínios (ex.: `m.youtube.com`, `www.reddit.com` também contam). Não é correspondência por path/URL completa.
- **Fora de escopo:** categorização de sites — existe apenas uma lista plana, sem categorias.

#### US-06 — Ser avisado ao entrar em um site de distração
**Como** usuário em sessão ativa,
**quero** que a extensão perceba quando eu troco para um domínio da lista de distrações,
**para que** eu seja confrontado com a pergunta "isso faz parte do objetivo?" no momento certo, não depois.

**Critérios de aceite:**
- A detecção considera troca de aba ativa (`chrome.tabs.onActivated`) e mudança de URL na aba ativa (`chrome.tabs.onUpdated`).
- O match de domínio cobre o domínio raiz e seus subdomínios.
- Só a aba ativa e em foco na janela em foco do sistema operacional é avaliada — abas de distração em segundo plano não disparam nada até serem efetivamente ativadas.

**Status:** ✅ Implementado — `src/background/listeners/tabs.ts`, `src/background/listeners/windows.ts`, `src/domain/distraction/domainmatcher.ts`.

#### US-07 — Não ser incomodado por passagens rápidas e acidentais
**Como** usuário que às vezes clica num link errado e volta na hora,
**quero** que um clique acidental num site de distração não dispare nenhum alerta,
**para que** a extensão não vire fonte de ruído por engano de navegação.

**Critérios de aceite:**
- O alerta só aparece se o usuário permanecer no domínio de distração por pelo menos N segundos (configurável, default 5s — ver seção 9).
- Se o usuário sair antes desse tempo, o período conta como tempo focado, sem gerar evento de distração.
- O disparo é feito por um alarme avulso por visita (`chrome.alarms`, não `setTimeout`), com um heartbeat periódico como rede de segurança caso o alarme avulso se perca.

**Status:** ✅ Implementado — `src/background/sessioncontroller.ts` (`alarmNameForVisit`, `handleAlertThresholdReached`, `handleHeartbeat`).

#### US-08 — Não ser perguntado de novo sobre o mesmo site depois de já ter confirmado
**Como** usuário que já respondeu "Sim" para um domínio nesta sessão,
**quero** não ser interrompido de novo pelo mesmo domínio,
**para que** a extensão não vire spam de popups repetidos para algo que eu já disse que faz parte do objetivo.

**Critérios de aceite:**
- Depois de uma resposta "Sim" para um domínio, novas visitas a esse mesmo domínio na mesma sessão não geram novo alerta.
- Uma resposta "Não" **não** gera essa supressão: cada nova visita ao domínio depois de um "Não" gera um novo alerta, porque o usuário já foi avisado que aquilo não é o objetivo, e voltar lá merece novo aviso.
- Múltiplas visitas ao mesmo domínio na mesma sessão são avaliadas independentemente para fins de contagem de tempo (soma-se ao total de tempo distraído/focado); a deduplicação de popup só se aplica a respostas "Sim".

**Status:** ✅ Implementado — `src/domain/distraction/deduplication.ts`, usado em `triggerAlert` (`src/background/sessioncontroller.ts`).

### Épico 4 — Responder ao alerta de distração

**Regras de negócio:**
- Enquanto o alerta está pendente de resposta, a contagem de tempo continua rodando normalmente atribuída ao domínio de distração — a resposta do usuário é retroativa e reclassifica o tempo já gasto quando ele responde.
- **Resposta "Sim":** registra o evento como distração ignorada/permitida no log da sessão (sem impacto negativo na pontuação); o tempo gasto nesse domínio a partir de agora conta como tempo focado.
- **Resposta "Não":** registra o evento como distração confirmada; exibe o destaque "Você saiu do foco" com botão "Voltar ao trabalho"; o tempo gasto no domínio, do momento de entrada em diante, passa a contar como tempo distraído e conta para a pontuação.
- **Botão "Voltar ao trabalho":** ativa a **última aba produtiva** — a última aba ativa, antes da distração atual, que não pertencia a um domínio da lista de distrações dentro da sessão ativa. Se essa aba não existir mais (foi fechada), a extensão abre uma nova aba em branco, em vez de falhar silenciosamente.
- Clicar em "Voltar ao trabalho" é **opcional** — o usuário pode ignorar o alerta e continuar no site de distração; nesse caso a sessão continua computando tempo distraído normalmente até a próxima troca de aba.

#### US-09 — Ver o alerta na própria página, de forma que eu não vá perder
**Como** usuário que acabou de entrar em um site de distração,
**quero** ver um destaque visual chamativo sobreposto à própria página,
**para que** o alerta realmente me alcance — diferente de uma notificação do sistema operacional, que pode ser silenciada ou agrupada sem eu perceber.

**Critérios de aceite:**
- O alerta é um overlay renderizado pelo content script diretamente na aba onde o usuário está, dentro de um Shadow DOM isolado do CSS da página.
- A pergunta exibida é: "Você entrou em `<domínio>`. Isso faz parte do objetivo atual?", com botões **Sim** e **Não**.
- Funciona mesmo em abas que já estavam abertas antes da extensão carregar (injeção sob demanda via `chrome.scripting.executeScript` quando o envio direto falha).

**Status:** ✅ Implementado — `src/content/distractionoverlay.ts`, `src/services/messaging/overlay.ts`.

> **Nota de decisão:** a extensão originalmente usava `chrome.notifications` (notificação nativa do sistema operacional) como mecanismo do alerta de confirmação. Na prática, o macOS pode agrupar/atrasar essas notificações silenciosamente (ex.: recurso "Resumir notificações"), fazendo o alerta nunca aparecer na tela mesmo com a permissão concedida — o que quebra o mecanismo central do produto. Por isso o alerta passou a ser renderizado dentro da própria página, via content script, que não depende de nenhuma configuração de notificação do sistema operacional. `chrome.notifications` foi removido; o content script é o único canal do alerta de confirmação.

#### US-10 — Confirmar que o site faz parte do objetivo
**Como** usuário que está, de fato, usando aquele site para a tarefa atual,
**quero** clicar em "Sim",
**para que** o tempo gasto ali conte como tempo focado, não como distração.

**Critérios de aceite:**
- Ao responder "Sim", o evento é registrado como distração ignorada/permitida, sem impacto negativo na pontuação.
- O tempo dessa visita passa a contar como tempo focado a partir de então (reclassificação retroativa).

**Status:** ✅ Implementado — `src/background/sessioncontroller.ts` (`answerDistraction`), `src/domain/session/timeclassification.ts`.

#### US-11 — Admitir que saí do foco
**Como** usuário que reconhece que se distraiu,
**quero** clicar em "Não",
**para que** a extensão registre isso honestamente e me ofereça um caminho de volta.

**Critérios de aceite:**
- Ao responder "Não", o evento é registrado como distração confirmada.
- O overlay muda para o destaque "Você saiu do foco" com o botão "Voltar ao trabalho".
- O tempo da visita, do momento de entrada em diante, passa a contar como tempo distraído.

**Status:** ✅ Implementado — `src/background/sessioncontroller.ts` (`answerDistraction`).

#### US-12 — Voltar rapidamente ao trabalho depois de admitir a distração
**Como** usuário que acabou de clicar em "Não",
**quero** um botão que me leve de volta para onde eu estava trabalhando,
**para que** eu não precise procurar manualmente a aba certa entre várias abertas.

**Critérios de aceite:**
- "Voltar ao trabalho" ativa a última aba que não era um domínio de distração dentro da sessão ativa.
- Se essa aba foi fechada, a extensão abre uma aba em branco no lugar, em vez de falhar silenciosamente.
- Clicar no botão é sempre opcional — ignorar o alerta e continuar no site de distração é permitido, e o tempo continua sendo contado como distraído normalmente.

**Status:** ✅ Implementado — `src/background/sessioncontroller.ts` (`returnToWork`).

#### US-13 — Não ficar em limbo se eu nunca responder ao alerta
**Como** usuário que ignora o alerta e simplesmente troca de aba sem clicar em nada,
**quero** que a extensão trate esse silêncio de forma consistente,
**para que** o tempo dessa visita não fique com uma classificação ambígua no relatório final.

**Critérios de aceite:**
- Se o tempo mínimo foi atingido e a visita termina sem resposta, o tempo conta como distraído para fins de tempo — mas **não** gera o desconto fixo de -5 pontos da pontuação, que é exclusivo de uma resposta "Não" explícita (ver seção 7).

**Status:** ✅ Implementado — `src/domain/session/timeclassification.ts`, `src/domain/session/scoring.ts`.

### Épico 5 — Encerrar sessão e ver relatório

**Regras de negócio:**
- Botão "Finalizar sessão" disponível a qualquer momento durante a sessão ativa. Ao finalizar: fecha o cronômetro (`endedAt = now()`); calcula métricas finais (tempo total, focado, distraído, quantidade de distrações confirmadas, sites mais acessados, pontuação); persiste a sessão finalizada em `History`; exibe a tela de relatório; retorna o estado global para "sem sessão ativa".
- **Uma sessão finalizada é imutável** — não pode ser reaberta ou editada, apenas consultada no histórico.

#### US-14 — Ver um resumo objetivo ao finalizar a sessão
**Como** usuário que acabou de clicar em "Finalizar sessão",
**quero** ver imediatamente tempo total, tempo focado, tempo distraído, distrações confirmadas, sites mais acessados e uma pontuação,
**para que** eu saiba, sem esforço de interpretação, como foi minha sessão.

**Critérios de aceite:**
- A pontuação começa em 100, perde 5 pontos por distração confirmada e 1 ponto por minuto distraído (fracionado), nunca fica abaixo de 0 nem acima de 100 (ver seção 7).
- A lista de "sites mais acessados" mostra os domínios de distração visitados, ordenados por tempo.

**Status:** ✅ Implementado — `src/popup/pages/report.tsx`, `src/domain/session/scoring.ts`, `src/domain/session/sessionmetrics.ts`.

#### US-15 — Confiar que uma sessão finalizada nunca muda
**Como** usuário que olha um relatório antigo,
**quero** ter certeza de que aqueles números não foram alterados depois,
**para que** eu possa confiar no meu próprio histórico como registro fiel do que aconteceu.

**Critérios de aceite:**
- Uma sessão finalizada é persistida em `History` e não há nenhum caminho de UI que permita editá-la.

**Status:** ✅ Implementado — `src/services/storage/historyrepository.ts`.

#### US-16 — Começar uma sessão nova sem fricção depois do relatório
**Como** usuário que acabou de ver o relatório,
**quero** um botão "Nova sessão",
**para que** eu volte à tela inicial e possa começar a próxima tarefa imediatamente.

**Critérios de aceite:**
- Clicar em "Nova sessão" leva o estado global de volta a `idle`, disponibilizando a Home.

**Status:** ✅ Implementado — `src/popup/pages/report.tsx`, `src/domain/session/sessionmachine.ts` (`dismissReport`).

### Épico 6 — Histórico

**Regras de negócio:**
- Cada sessão finalizada gera um registro em `History` contendo: objetivo, data/hora de início e fim, tempo total, tempo focado, tempo distraído, quantidade de distrações confirmadas, lista dos domínios mais acessados (com tempo por domínio) e pontuação final.
- A tela de histórico lista as sessões em ordem cronológica decrescente (mais recente primeiro). Cada item exibe objetivo, tempo total, pontuação e data.
- Clicar em um item expande/exibe os detalhes completos daquela sessão — mas **não permite edição**.
- **Fora de escopo:** exportar/importar histórico, filtros e busca avançada.
- Não há limite de retenção definido (todo o histórico é mantido em `chrome.storage.local`), embora exista consciência de que a API tem uma quota de armazenamento de alguns MB — se isso se tornar um problema real, será tratado como melhoria técnica, não como mudança de regra de negócio.

#### US-17 — Consultar sessões passadas
**Como** usuário que quer revisar seu progresso ao longo do tempo,
**quero** uma lista de todas as sessões finalizadas, da mais recente para a mais antiga,
**para que** eu identifique padrões nos meus próprios hábitos de navegação.

**Critérios de aceite:**
- Cada item da lista mostra objetivo, tempo total, pontuação e data.
- A ordenação é sempre por data decrescente.

**Status:** ✅ Implementado — `src/popup/pages/history.tsx`, `src/popup/hooks/usehistory.ts`.

#### US-18 — Ver os detalhes de uma sessão específica
**Como** usuário olhando a lista de histórico,
**quero** clicar em um item e expandir seus detalhes,
**para que** eu veja tempo focado/distraído, distrações confirmadas e sites mais acessados daquela sessão em particular, sem sair da lista.

**Critérios de aceite:**
- Clicar expande/recolhe o item in-place.
- Não existe nenhuma ação de edição disponível nos detalhes expandidos.

**Status:** ✅ Implementado — `src/popup/pages/history.tsx`.

### Épico 7 — Configurações

**Regras de negócio:**
- **Editar lista de sites de distração:** adicionar/remover domínios da entidade `DistractionSite`.
- **Ativar/desativar notificações:** liga/desliga o overlay de confirmação exibido na página. Se desativado, a extensão continua registrando tempo/domínio silenciosamente, apenas sem perguntar — e, nesse modo, **todo tempo em domínio de distração conta automaticamente como "distraído"** (já que não há como o usuário confirmar "Sim"), evitando ambiguidade na pontuação.
- **Tempo mínimo para alerta:** número de segundos que o usuário precisa permanecer em um domínio de distração antes do alerta aparecer, com limites de 1 a 300 segundos (default: 5s).
- **Fora de escopo:** categorias de site, modo escuro, exportar/importar configurações.

#### US-19 — Personalizar a lista de sites de distração
**Como** usuário cujos hábitos de distração são específicos (ex.: um fórum de nicho que não está na lista default),
**quero** adicionar e remover domínios da lista de distração,
**para que** a detecção reflita a realidade da minha navegação, não só uma lista genérica.

**Critérios de aceite:**
- A lista inicial vem com 10 domínios default: `youtube.com`, `instagram.com`, `reddit.com`, `x.com`, `twitter.com`, `facebook.com`, `discord.com`, `tiktok.com`, `netflix.com`, `twitch.tv`.
- Adicionar/remover um domínio reflete imediatamente na detecção, sem precisar recarregar a extensão.

**Status:** ✅ Implementado — `src/popup/pages/settings.tsx`, `src/popup/hooks/usedistractionsites.ts`, `src/services/storage/distractionsiterepository.ts`.

#### US-20 — Desligar o alerta visual quando eu não quiser ser interrompido
**Como** usuário que às vezes prefere só ver os números no final, sem ser interrompido durante a sessão,
**quero** poder desativar as notificações/overlay,
**para que** a extensão continue registrando tempo e domínio silenciosamente, sem me tirar do fluxo.

**Critérios de aceite:**
- Notificações vêm ativadas por padrão (`DEFAULT_NOTIFICATIONS_ENABLED = true`).
- Com notificações desativadas, o overlay de confirmação nunca aparece.
- Nesse modo, todo tempo em domínio de distração conta automaticamente como distraído (não há como o usuário confirmar "Sim" sem o overlay), evitando ambiguidade na pontuação.

**Status:** ✅ Implementado — `src/popup/pages/settings.tsx`, `src/background/sessioncontroller.ts` (`triggerAlert`).

#### US-21 — Ajustar quanto tempo de tolerância antes do alerta aparecer
**Como** usuário com um estilo de navegação mais rápido ou mais lento,
**quero** configurar o "tempo mínimo para alerta" em segundos,
**para que** o comportamento se ajuste ao meu ritmo, em vez de um valor fixo que não me serve.

**Critérios de aceite:**
- O valor é editável nas Configurações, com limites de 1 a 300 segundos (`MIN_ALERT_SECONDS_LOWER_BOUND` / `MIN_ALERT_SECONDS_UPPER_BOUND`) e default de 5 segundos.
- A mudança se aplica imediatamente às próximas visitas a domínios de distração.

**Status:** ✅ Implementado — `src/popup/pages/settings.tsx`, `src/popup/hooks/usesettings.ts`.

### Épico 8 — Resiliência e continuidade

**Regras de negócio:**
- Se o Chrome fechar/crashar com uma sessão ativa, ao reabrir o navegador a sessão deve ser restaurada automaticamente a partir do `chrome.storage.local`.
- Não existe encerramento automático por inatividade/timeout — decisão deliberada de simplicidade.
- Casos extremos de multitasking agressivo entre janelas (trocas de foco muito rápidas entre domínios diferentes) podem gerar contagens imprecisas; aceitável para o escopo atual.

#### US-22 — Não perder minha sessão se o Chrome fechar ou travar
**Como** usuário cujo notebook às vezes precisa reiniciar, ou cujo Chrome pode crashar,
**quero** que minha sessão ativa continue de onde parou ao reabrir o navegador,
**para que** eu não perca o controle do meu tempo de foco por um motivo puramente técnico, fora do meu controle.

**Critérios de aceite:**
- Ao reiniciar o service worker (`chrome.runtime.onStartup` ou recarga do worker), o estado é sempre relido do `chrome.storage.local` antes de qualquer decisão — nunca assume `idle` por padrão.
- O cronômetro reflete o tempo real decorrido, calculado por diferença de timestamps, nunca por um contador que zera ao reiniciar.

**Status:** ⚠️ Implementado, validado por roteiro manual — `src/background/sessioncontroller.ts`, `src/background/index.ts`.

#### US-23 — Ter contagem de tempo correta mesmo com múltiplas janelas do Chrome
**Como** usuário que trabalha com mais de uma janela do Chrome aberta,
**quero** que o monitoramento sempre siga a aba realmente em foco do sistema operacional,
**para que** trocar de janela não gere contagens erradas de tempo focado/distraído.

**Critérios de aceite:**
- O monitoramento reage a `chrome.windows.onFocusChanged` além de `chrome.tabs.onActivated`/`onUpdated`.
- Perder o foco do navegador (nenhuma janela do Chrome em foco) encerra a visita corrente sem atribuí-la incorretamente a nenhum domínio.

**Status:** ✅ Implementado — `src/background/listeners/windows.ts`, `src/background/sessioncontroller.ts` (`handleBrowserFocusLost`).

---

## 6. Regras de tempo e contabilização

Esta seção existe porque "tempo focado" e "tempo distraído" são conceitos ambíguos se não forem definidos com precisão.

1. **Tempo total da sessão** = `endedAt - startedAt`, sem descontar nada (inclui tempo de tela bloqueada/inativa — não há detecção de idle).
2. **Tempo em um domínio** é calculado pela diferença entre o timestamp em que ele se tornou a aba ativa e o timestamp em que deixou de ser (troca de aba, troca de domínio, ou fim da sessão).
3. **Classificação do tempo de um domínio de distração:**
   - Antes de qualquer resposta do usuário (popup ainda não respondido, respeitando o tempo mínimo para alerta): o tempo é provisoriamente "neutro" e só é classificado retroativamente quando o usuário responde.
   - Resposta "Sim": todo o tempo gasto nessa visita conta como **focado**.
   - Resposta "Não": todo o tempo gasto nessa visita conta como **distraído**.
   - Se o usuário sair do domínio **antes** do tempo mínimo ser atingido (o alerta nunca chegou a ser exibido): o tempo conta como **focado** (não penaliza passagens rápidas/acidentais).
   - Se o tempo mínimo foi atingido e a visita termina (troca de aba/domínio ou fim da sessão) **sem resposta**: o tempo conta como **distraído** para fins de tempo — mesma classificação de "Não". Isso **não** é uma "distração confirmada" pela definição da seção 3 (que exige um "Não" explícito), logo **não** gera o desconto fixo de -5 pontos da seção 7, apenas o desconto por minuto distraído.
4. **Tempo em domínios fora da lista de distração:** sempre conta como **focado**.
5. **Múltiplas visitas ao mesmo domínio na mesma sessão:** cada visita é avaliada independentemente para fins de tempo (soma-se ao total), mas a deduplicação de popup (seção 5, Épico 3) só se aplica a respostas "Sim".

---

## 7. Pontuação de foco

Regra determinística e simples, sem IA:

- Pontuação inicial da sessão: **100**.
- Cada **distração confirmada** (resposta "Não"): **-5 pontos**, aplicado uma única vez no momento da resposta (não repete por cada minuto adicional de ficar lá — isso é coberto pela regra abaixo).
- Cada **minuto** de tempo classificado como **distraído** (ver seção 6): **-1 ponto** por minuto, fracionado proporcionalmente para minutos parciais (ex.: 30s distraído = -0,5 ponto).
- Pontuação mínima: **0** (nunca negativa). Pontuação máxima: **100** (sem bônus acima disso).
- A pontuação é calculada apenas no momento de finalizar a sessão (não precisa ser recalculada em tempo real a cada evento, embora possa ser exibida como preview durante a sessão ativa — isso é opcional de UX, não uma regra obrigatória).

---

## 8. Entidades de dados

Visão de negócio, não de schema técnico (o schema técnico está em `docs/arquitetura_diagramas.md` seção 8):

| Entidade | Campos essenciais |
|---|---|
| `Objective` | texto do objetivo, criado em |
| `Session` | objetivo associado, startedAt, endedAt, status (ativa/finalizada), lista de eventos de distração, métricas finais |
| `DistractionEvent` | domínio, timestamp de entrada, timestamp de saída, resposta do usuário (sim/não/sem resposta), tempo classificado |
| `Settings` | lista de domínios de distração, notificações ativas (bool), tempo mínimo para alerta (segundos) |
| `History` | lista de sessões finalizadas com suas métricas consolidadas |
| `DistractionSite` | domínio (string), ativo (bool) |

Toda a persistência é local (`chrome.storage.local`), sem sincronização remota.

---

## 9. Requisitos funcionais e não funcionais

### 9.1 Requisitos funcionais (RF)

| ID | Requisito |
|---|---|
| RF01 | Criar sessão vinculada a um objetivo. |
| RF02 | Finalizar sessão e gerar relatório. |
| RF03 | Cadastrar/editar objetivo antes de iniciar a sessão. |
| RF04 | Cronometrar tempo total e tempo focado da sessão. |
| RF05 | Detectar mudança de aba ativa. |
| RF06 | Detectar acesso a domínios da lista de distração (incluindo subdomínios). |
| RF07 | Exibir alerta de confirmação ("faz parte do objetivo?"). |
| RF08 | Registrar distrações confirmadas e ignoradas. |
| RF09 | Exibir histórico de sessões passadas. |
| RF10 | Persistir todos os dados localmente, sobrevivendo a reinícios do navegador. |

### 9.2 Requisitos não funcionais

- Manifest V3 obrigatório.
- Tempo de carregamento do popup inferior a 500ms.
- Sem qualquer chamada de rede/backend — extensão 100% offline.
- Persistência local via `chrome.storage.local`.
- Código modular e com tipagem completa (TypeScript estrito).
- A extensão não deve degradar a performance de navegação do usuário (listeners leves, sem polling agressivo).

---

## 10. Critérios de sucesso do MVP

O MVP é considerado bem-sucedido se o usuário consegue, sem fricção:

1. Iniciar uma sessão em menos de 10 segundos.
2. Definir um objetivo com um único campo de texto.
3. Visualizar o tempo de foco em tempo real.
4. Receber o alerta de confirmação ao acessar um site da lista.
5. Finalizar a sessão e ver um resumo claro (tempo total, focado, distraído, pontuação).
6. Consultar esse resumo depois, no histórico.

Mesmo sem IA, o valor entregue é o **aumento de consciência** sobre os próprios hábitos de navegação — esse é o critério de sucesso qualitativo por trás de todos os critérios quantitativos acima. Dos seis critérios, quatro são confirmados por revisão de código/testes automatizados; os outros dois (cronometragem real de "iniciar sessão" e medição de performance do popup) exigem validação manual em Chrome real.

---

## 11. Decisões registradas sobre pontos em aberto

Estas são áreas onde a regra vigente é uma decisão pragmática de simplicidade, revisada explicitamente durante o desenvolvimento (não resolvida silenciosamente no código):

- **Detecção de inatividade** (usuário longe do teclado): permanece fora de escopo — o tempo corre mesmo sem interação.
- **Suporte a modo incógnito**: permanece fora de escopo.
- **Multitasking agressivo entre janelas** (duas janelas do Chrome com troca de foco muito rápida entre domínios diferentes): o comportamento atual (regra de foco da seção 5, Épico 3 + serialização de mutações de sessão no background) foi aceito como está — a regra existente já cobre o caso geral; casos extremos podem gerar imprecisões aceitáveis.
- **Quota de armazenamento do histórico**: nenhum limite de retenção é implementado; aceito como está, revisitável como melhoria técnica futura, não como mudança de regra de negócio.

---

## 12. Rastreabilidade

| História | Requisito funcional | Arquivo principal |
|---|---|---|
| US-01, US-02 | RF01, RF03 | `src/background/sessioncontroller.ts` |
| US-03 | RF01 | `src/domain/session/sessionmachine.ts` |
| US-04 | RF04 | `src/popup/hooks/useelapsedtime.ts` |
| US-05 | RF02 | `src/popup/pages/activesession.tsx` |
| US-06, US-07, US-08 | RF05, RF06 | `src/background/sessioncontroller.ts` |
| US-09 a US-13 | RF07, RF08 | `src/content/distractionoverlay.ts` |
| US-14, US-15, US-16 | RF02 | `src/domain/session/scoring.ts` |
| US-17, US-18 | RF09 | `src/popup/pages/history.tsx` |
| US-19, US-20, US-21 | — (seção 9) | `src/popup/pages/settings.tsx` |
| US-22, US-23 | RF10 | `src/background/sessioncontroller.ts` |
