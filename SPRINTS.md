# Sprints — Refatoração & Hardening

## Sprint 1 — Segurança & Estabilidade (P0)

### 1.1 Mutex/Queue no browser
- Criar `src/browser/queue.ts` com uma fila serial (mutex) que garante uma operação de browser por vez
- Toda chamada a `getPersistentContext()` + navegação deve passar pela fila
- Funções afetadas: `collectLikes`, `collectFromProfile`, `postTweetViaUi`, `checkSessionHealth`

### 1.2 Auth básica na API
- Criar middleware `src/middleware/auth.ts` com bearer token lido de `API_TOKEN` no `.env`
- Aplicar em todas as rotas exceto `GET /api/health`
- Atualizar `.env.example`
- Frontend envia token via header (lido de `localStorage` ou prompt)

### 1.3 Validação de handle
- Criar helper `src/util/validate.ts` com `isValidHandle(h: string): boolean` — regex `/^[A-Za-z0-9_]{1,15}$/`
- Aplicar em: `POST /api/sync/profile/:handle`, `POST /api/authors`, `DELETE /api/authors/:handle`
- Retornar 400 se inválido

### 1.4 Graceful shutdown
- Em `server.ts`, tratar `SIGTERM` e `SIGINT`
- Parar o publish worker (`stopPublishWorker`)
- Fechar browser context (`closePersistentContext`)
- Fechar conexão SQLite
- Só então `process.exit(0)`

---

## Sprint 2 — Robustez do Worker & Config (P1)

### 2.1 Retry com backoff no publish worker
- Definir `MAX_ATTEMPTS = 3` em config
- Se falhou e `attempts < MAX_ATTEMPTS`: manter status `scheduled`, setar `run_at` para `now + backoff` (30s, 2min, 10min)
- Se `attempts >= MAX_ATTEMPTS`: marcar `failed`

### 2.2 Extrair magic numbers para config
- Centralizar em `src/config.ts`: timeouts de navegação, delays, threshold de similaridade, max tweet length, intervalo do worker, limites de scroll
- Usar as constantes em todos os arquivos que hoje têm valores hardcoded

---

## Sprint 3 — Arquitetura Backend (P2)

### 3.1 Separar routes
- Criar `src/routes/` com: `health.ts`, `session.ts`, `sync.ts`, `events.ts`, `topics.ts`, `drafts.ts`, `schedule.ts`, `authors.ts`
- Cada arquivo exporta um `Router`
- `server.ts` fica só com setup (middleware, mount routes, listen, shutdown)

### 3.2 Middleware de erro
- Criar `src/middleware/errorHandler.ts` — Express error handler centralizado
- Remover try/catch de cada rota; usar `next(e)` ou wrapper async

### 3.3 Centralizar queries (repository)
- Criar `src/db/repositories/` com: `events.repo.ts`, `drafts.repo.ts`, `scheduled.repo.ts`, `authors.repo.ts`, `topics.repo.ts`
- Mover todo SQL inline para métodos tipados

---

## Sprint 4 — Tipagem & Tipos Compartilhados (P2)

### 4.1 Tipos compartilhados
- Criar `src/shared/types.ts` com interfaces: `RawEvent`, `Draft`, `ScheduledPost`, `TopicRun`, `Author`, `SessionHealth`
- Importar no backend (repos, routes) e no frontend (App.tsx)

### 4.2 Remover `unknown[]` e type assertions
- Tipar todos os `useState` no frontend com as interfaces compartilhadas
- Criar wrapper genérico para `db.prepare` que aceita tipo de retorno, eliminando `as` casts

---

## Sprint 5 — Frontend (P2)

### 5.1 Decompor App.tsx
- Extrair componentes: `SessionCard`, `CollectCard`, `AuthorsSection`, `TopicsSection`, `DraftsSection`, `ScheduleSection`, `ScheduledQueue`, `EventsTable`
- Manter estado global no App, passar via props
- Criar `web/src/components/`

### 5.2 API client tipado
- Criar `web/src/api.ts` com funções tipadas (`getSession()`, `syncLikes()`, etc.)
- Retornam tipos do `shared/types.ts`
- Tratamento de erro centralizado

---

## Sprint 6 — Features & Testes (P3)

### 6.1 Cancelar/editar scheduled posts
- `DELETE /api/scheduled/:id` — cancela se status = `scheduled`
- `PATCH /api/scheduled/:id` — editar body/run_at
- Botões na UI (ScheduledQueue component)

### 6.2 Edição de draft na UI
- Input inline ou modal no DraftsSection para editar texto
- Chama `PATCH /api/drafts/:id` com novo body

### 6.3 Health real do DB
- `GET /api/health` verifica `db.pragma('integrity_check')` e retorna status real

### 6.4 Paginação
- Query param `?page=1&limit=50` nos endpoints de lista
- Retornar `{ data: [], total: number, page: number }`

### 6.5 Testes
- Testes unitários: `heuristicTopics`, `validate`, `queue`, `config`
- Testes de integração: repositories (SQLite in-memory), routes (supertest)
- Setup: vitest
