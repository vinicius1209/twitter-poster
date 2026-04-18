# Roadmap — Twitter Poster → SaaS

## Visão

Transformar de script local em produto SaaS com modelo híbrido:
- **Cloud (@twitter-poster/core):** API, dados, IA, billing, painel web
- **Local (@twitter-poster/agent):** Browser automation no laptop do usuário

---

## Épico 1 — Separação Core/Agent (Fundação)

### Objetivo
Separar o monolito em 2 pacotes independentes que se comunicam via API REST.

### Sprint 11 — Monorepo + Shared Package

| # | História | Descrição | Arquivos |
|---|----------|-----------|----------|
| 1.1 | Converter para monorepo | Estrutura com `packages/core`, `packages/agent`, `packages/shared` usando npm workspaces | `package.json`, novo `packages/` |
| 1.2 | Extrair tipos compartilhados | Mover `src/shared/types.ts` → `packages/shared/src/types.ts`, exportar como `@twitter-poster/shared` | `packages/shared/` |
| 1.3 | Extrair utilitários compartilhados | Mover `delay.ts`, `validate.ts`, `pagination.ts` → `packages/shared/src/` | `packages/shared/src/` |
| 1.4 | Configurar builds | TypeScript project references, cada package compila independente | `tsconfig.json` por package |

### Sprint 12 — Extrair Agent

| # | História | Descrição | Arquivos |
|---|----------|-----------|----------|
| 2.1 | Mover browser layer | `src/browser/*` → `packages/agent/src/browser/` | 6 arquivos |
| 2.2 | Mover jobs do browser | `publishWorker.ts`, `collectMetrics.ts` → `packages/agent/src/jobs/` | 2 arquivos |
| 2.3 | Desacoplar collect.ts do DB | `collect.ts` retorna dados em vez de escrever no DB. A inserção fica no core | `collect.ts`, novo `sync.service.ts` |
| 2.4 | Agent CLI standalone | `packages/agent/` roda independente: `npx @twitter-poster/agent` | `packages/agent/src/cli.ts` |
| 2.5 | Agent se conecta ao Core via API | Agent faz POST para Core com tweets coletados, recebe drafts para publicar | `packages/agent/src/api-client.ts` |

### Sprint 13 — Extrair Core

| # | História | Descrição | Arquivos |
|---|----------|-----------|----------|
| 3.1 | Mover API + DB | `src/routes/*`, `src/db/*`, `src/middleware/*` → `packages/core/src/` | ~20 arquivos |
| 3.2 | Mover AI layer | `src/ai/*` → `packages/core/src/ai/` | 2 arquivos |
| 3.3 | Mover jobs do core | `analyze.ts`, `draft.ts` → `packages/core/src/jobs/` | 2 arquivos |
| 3.4 | Nova rota: POST /api/sync/ingest | Core recebe tweets do Agent via API (substitui escrita direta no DB) | `packages/core/src/routes/ingest.ts` |
| 3.5 | Nova rota: GET /api/agent/tasks | Core retorna tarefas pendentes para o Agent (publicar, coletar métricas) | `packages/core/src/routes/agent-tasks.ts` |
| 3.6 | Mover frontend | `web/` → `packages/core/web/` | diretório inteiro |
| 3.7 | Testes de integração core↔agent | Testar fluxo: agent coleta → core ingere → core gera draft → agent publica | `packages/core/tests/`, `packages/agent/tests/` |

---

## Épico 2 — Cloud Deploy (Sair do Localhost)

### Objetivo
Core rodando na cloud, frontend acessível de qualquer lugar.

### Sprint 14 — Migração SQLite → Supabase

| # | História | Descrição |
|---|----------|-----------|
| 4.1 | Criar projeto Supabase | Setup no supabase.com, criar tabelas via migrations SQL (já temos os .sql) |
| 4.2 | Abstração de DB | Criar interface `DatabaseAdapter` implementada por `SQLiteAdapter` e `SupabaseAdapter` |
| 4.3 | Supabase adapter | Implementar `SupabaseAdapter` usando `@supabase/supabase-js` |
| 4.4 | Config via env | `DB_PROVIDER=sqlite|supabase`, `SUPABASE_URL`, `SUPABASE_KEY` |
| 4.5 | Migrar repositories | Cada repo usa `getAdapter()` em vez de `getDb()` — mesma interface, backend diferente |
| 4.6 | Testar ambos adapters | Rodar test suite inteira com SQLite e com Supabase |

### Sprint 15 — Auth + Multi-tenant

| # | História | Descrição |
|---|----------|-----------|
| 5.1 | Supabase Auth | Login por magic link (email), Google OAuth |
| 5.2 | Row Level Security | Cada usuário só vê seus dados (RLS policies no Supabase) |
| 5.3 | Tabela `users` | id, email, plan, agent_token, created_at |
| 5.4 | Agent token | Cada usuário recebe um token único para o Agent se autenticar |
| 5.5 | Middleware de tenant | Extrair user_id do JWT, injetar em todas as queries |
| 5.6 | Frontend: tela de login | Login page, redirect para dashboard |

### Sprint 16 — Deploy

| # | História | Descrição |
|---|----------|-----------|
| 6.1 | Core API no Railway/Fly.io | Dockerfile, health check, env vars, auto-deploy |
| 6.2 | Frontend no Vercel | Build estático, proxy API, domínio customizado |
| 6.3 | CI/CD | GitHub Actions: lint, typecheck, test, deploy |
| 6.4 | Monitoring | Logs estruturados, error tracking (Sentry free tier) |
| 6.5 | Domínio + SSL | twitterposter.com.br ou nome escolhido |

---

## Épico 3 — Monetização

### Objetivo
Billing funcional, planos diferenciados, usuários pagantes.

### Sprint 17 — Billing

| # | História | Descrição |
|---|----------|-----------|
| 7.1 | Stripe/Lemon Squeezy | Setup de produtos e preços em BRL |
| 7.2 | Planos: Free/Criador/Pro | Limites por plano (gerações/mês, personas, perfis monitorados) |
| 7.3 | Webhook de pagamento | Ativa/desativa plano no Supabase quando pagamento confirma |
| 7.4 | Middleware de limites | Checar limites do plano antes de cada operação (gerar, coletar, etc) |
| 7.5 | Tela de pricing | Página pública com planos e botão de checkout |
| 7.6 | Portal do cliente | Gerenciar assinatura, trocar plano, cancelar |

### Sprint 18 — Landing Page + Onboarding

| # | História | Descrição |
|---|----------|-----------|
| 8.1 | Landing page | Hero, features, pricing, CTA, demo em vídeo |
| 8.2 | Waitlist | Captura de email antes do lançamento |
| 8.3 | Onboarding guiado | Primeira vez: setup do Agent, login no X, primeira coleta, primeiro draft |
| 8.4 | Email de boas-vindas | Template com link para download do Agent + guia rápido |

---

## Épico 4 — Diferenciação (Features que justificam pagar)

### Sprint 19 — Estudo de Perfil

| # | História | Descrição |
|---|----------|-----------|
| 9.1 | Análise profunda de perfil | IA analisa últimos 200 posts de qualquer @handle: temas, estilo, horários, formato preferido |
| 9.2 | Relatório visual | Card com resumo: "Este perfil posta sobre X, no tom Y, principalmente às Zh" |
| 9.3 | "Inspirar-se neste perfil" | Botão que usa o relatório como contexto para gerar drafts no estilo do perfil |

### Sprint 20 — Ghostwriter Mode

| # | História | Descrição |
|---|----------|-----------|
| 10.1 | Input: artigo/ideia/URL | Usuário cola um texto longo ou URL |
| 10.2 | Repurpose engine | IA transforma em 5 posts otimizados para X (curto, longo, thread) |
| 10.3 | Variações por persona | Cada persona gera sua versão do mesmo conteúdo |

### Sprint 21 — Calendário Editorial

| # | História | Descrição |
|---|----------|-----------|
| 11.1 | Visão semanal/mensal | Grid visual com posts agendados por dia/hora |
| 11.2 | Sugestão de temas | IA sugere temas para dias vazios baseado nos tópicos analisados |
| 11.3 | Drag & drop | Mover posts entre datas arrastando |
| 11.4 | Melhores horários | Highlight nos horários com mais engajamento histórico |

---

## Épico 5 — Retenção

### Sprint 22 — Engagement Loop

| # | História | Descrição |
|---|----------|-----------|
| 12.1 | Email semanal | Resumo de performance: posts, likes, views, crescimento de followers |
| 12.2 | Sugestão diária | 1 rascunho pronto por dia via email/notificação |
| 12.3 | Streak de consistência | "Você postou 7 dias seguidos. Engajamento subiu 23%" |
| 12.4 | Benchmark vs mentores | "Seus posts tiveram 45% mais likes que a média dos seus mentores" |

### Sprint 23 — LLM Logs + Auditoria

| # | História | Descrição |
|---|----------|-----------|
| 13.1 | Tabela `llm_logs` | timestamp, model, prompt_hash, tokens_in, tokens_out, duration_ms, cost |
| 13.2 | Dashboard de uso | "Você usou X tokens este mês. Custo estimado: R$Y" |
| 13.3 | Replay de geração | Ver o prompt exato que gerou cada draft (debug + aprendizado) |

---

## Épico 6 — Escala

### Sprint 24 — Multi-plataforma

| # | História | Descrição |
|---|----------|-----------|
| 14.1 | LinkedIn adapter | Novos selectors para linkedin.com, mesmo engine de coleta/publicação |
| 14.2 | Threads adapter | Meta Threads (threads.net) |
| 14.3 | Cross-post | Gerar variações do mesmo conteúdo adaptadas para cada plataforma |

### Sprint 25 — Modo Agência

| # | História | Descrição |
|---|----------|-----------|
| 15.1 | Multi-perfil | 1 conta gerencia múltiplos perfis do X |
| 15.2 | Aprovação em equipe | Workflow: criador gera → editor aprova → agenda publica |
| 15.3 | Relatório por cliente | PDF exportável com métricas para entregar ao cliente |

### Sprint 26 — Marketplace de Personas

| # | História | Descrição |
|---|----------|-----------|
| 16.1 | Personas públicas | Usuários compartilham personas criadas |
| 16.2 | Personas premium | Criadores vendem personas especializadas (R$5-20 cada) |
| 16.3 | Rating + reviews | Comunidade avalia personas |

---

## Ordem de Execução Recomendada

```
AGORA (Semana 1-2)
├── Sprint 11: Monorepo + Shared
├── Sprint 12: Extrair Agent
└── Sprint 13: Extrair Core

MÊS 1 (Semana 3-4)
├── Sprint 14: SQLite → Supabase
├── Sprint 15: Auth + Multi-tenant
└── Sprint 16: Deploy

MÊS 2
├── Sprint 17: Billing
├── Sprint 18: Landing Page
└── Sprint 19: Estudo de Perfil

MÊS 3
├── Sprint 20: Ghostwriter
├── Sprint 21: Calendário
└── Sprint 22: Engagement Loop

MÊS 4+
├── Sprint 23: LLM Logs
├── Sprint 24: Multi-plataforma
├── Sprint 25: Agência
└── Sprint 26: Marketplace
```

## Métricas de Sucesso

| Milestone | Meta | Quando |
|-----------|------|--------|
| MVP SaaS online | Deploy funcionando, 1 usuário (você) | Mês 1 |
| Beta fechado | 10 usuários testando | Mês 2 |
| Primeiro pagante | 1 assinatura Criador (R$29) | Mês 2 |
| Product-Market Fit | 50 usuários, <10% churn mensal | Mês 4 |
| Ramen profitable | R$5.000/mês recorrente | Mês 6 |
| Escala | R$20.000/mês, equipe de 2 | Mês 12 |
