import { useCallback, useEffect, useState } from "react";
import type {
  RawEvent,
  Draft,
  ScheduledPost,
  TopicRun,
  Author,
  Persona,
  MetricsSummary,
  SessionHealth,
} from "@shared/types.js";
import { api, setToken as persistToken, type QuickSessionStatus } from "./api.js";
import { Step } from "./components/Step.js";
import { SessionCard } from "./components/SessionCard.js";
import { CollectCard } from "./components/CollectCard.js";
import { ProfileStudyCard } from "./components/ProfileStudyCard.js";
import { TopicsSection } from "./components/TopicsSection.js";
import { DraftsSection } from "./components/DraftsSection.js";
import { GhostwriterCard } from "./components/GhostwriterCard.js";
import { ScheduleSection } from "./components/ScheduleSection.js";
import { MetricsDashboard } from "./components/MetricsDashboard.js";

export function App() {
  const [token, setToken] = useState(() => localStorage.getItem("api_token") ?? "");
  const [showSettings, setShowSettings] = useState(false);
  const [session, setSession] = useState<SessionHealth | null>(null);
  const [quickStatus, setQuickStatus] = useState<QuickSessionStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [events, setEvents] = useState<RawEvent[]>([]);
  const [topics, setTopics] = useState<TopicRun[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledPost[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [collectionStats, setCollectionStats] = useState<{ source: string; count: number; latest: string; hasMedia: number }[]>([]);

  const [windowH, setWindowH] = useState(24);
  const [tone, setTone] = useState("direto, técnico, amigável");
  const [draftCount, setDraftCount] = useState(3);
  const [draftFormat, setDraftFormat] = useState<"short" | "long" | "thread">("short");
  const [mentorsUsed, setMentorsUsed] = useState<string[]>([]);
  const [analysisSource, setAnalysisSource] = useState<"llm" | "heuristic" | null>(null);
  const [scheduleBody, setScheduleBody] = useState("");
  const [scheduleAt, setScheduleAt] = useState("");
  const [scheduleDraftId, setScheduleDraftId] = useState<string | null>(null);
  const [openStep, setOpenStep] = useState(1);

  const loadAll = useCallback(async () => {
    try {
      const [qs, e, t, d, sch, a, p, m, cs] = await Promise.all([
        api.getSessionQuick(),
        api.listEvents(),
        api.listTopics(),
        api.listDrafts(),
        api.listScheduled(),
        api.listAuthors(),
        api.listPersonas(),
        api.getMetrics(),
        api.getCollectionStats(),
      ]);
      setQuickStatus(qs);
      setEvents(e.data);
      setTopics(t);
      setDrafts(d.data);
      setScheduled(sch.data);
      setAuthors(a);
      setPersonas(p);
      setMetrics(m);
      setCollectionStats(cs);
    } catch {
      setMsg("API offline? Inicie o servidor e tente novamente.");
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function run(label: string, fn: () => Promise<void>): Promise<void> {
    setBusy(label);
    setMsg("");
    try {
      await fn();
      await loadAll();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  // Step status logic
  const isLoggedIn = session?.loggedIn ?? false;
  const totalCollected = collectionStats.reduce((a, s) => a + s.count, 0);
  const hasEvents = totalCollected > 0;
  const hasTopics = topics.length > 0;
  const hasDrafts = drafts.length > 0;

  const stepStatus = (done: boolean, stepNum: number): "done" | "active" | "pending" => {
    if (done) return "done";
    if (stepNum === openStep) return "active";
    return "pending";
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Assistente <span>X</span></h1>
        <p>Coleta, análise e publicação automática — sem API do X</p>

        <button
          className="settings-toggle"
          onClick={() => setShowSettings(!showSettings)}
          title="Configurações"
        >
          ⚙
        </button>

        {showSettings && (
          <div className="settings-drawer">
            <label>API Token (vazio = sem autenticação)</label>
            <input
              type="password"
              placeholder="Token de acesso"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                persistToken(e.target.value);
              }}
            />
          </div>
        )}
      </header>

      <div className="pipeline">
        {/* ─── Step 1: Conectar ─── */}
        <Step
          number={1}
          title="Conectar"
          description="Abrir o navegador e verificar login no X"
          status={stepStatus(isLoggedIn, 1)}
          statusLabel={isLoggedIn ? "logado" : session ? "desconectado" : "verificar"}
          open={openStep === 1}
          onToggle={() => setOpenStep(openStep === 1 ? 0 : 1)}
        >
          <SessionCard
            session={session}
            quickStatus={quickStatus}
            busy={busy === "session"}
            onCheck={() => {
              void run("session", async () => {
                const s = await api.getSession();
                setSession(s);
                if (s.loggedIn) setOpenStep(2);
              });
            }}
          />
        </Step>

        {/* ─── Step 2: Coletar ─── */}
        <Step
          number={2}
          title="Coletar"
          description="Buscar curtidas e tweets de perfis monitorados"
          status={stepStatus(hasEvents, 2)}
          statusLabel={hasEvents ? `${totalCollected} tweets` : "coletar"}
          open={openStep === 2}
          onToggle={() => setOpenStep(openStep === 2 ? 0 : 2)}
        >
          <CollectCard
            stats={collectionStats}
            totalEvents={collectionStats.reduce((a, s) => a + s.count, 0)}
            authors={authors}
            busy={busy === "likes" || busy === "profile" || busy === "watchlist" || busy === "author" || busy === "del"}
            onSyncLikes={(scrolls, max) => run("likes", async () => {
              const r = await api.syncLikes(scrolls, max);
              setMsg(r.message);
            })}
            onSyncProfile={(h, scrolls, max) => run("profile", async () => {
              const r = await api.syncProfile(h, scrolls, max);
              setMsg(r.message);
            })}
            onSyncWatchlist={() => run("watchlist", async () => {
              const r = await api.syncWatchlist();
              setMsg(JSON.stringify(r.results, null, 2));
            })}
            onAddAuthor={(h) => run("author", () => api.addAuthor(h).then(() => {}))}
            onDeleteAuthor={(h) => run("del", () => api.deleteAuthor(h).then(() => {}))}
            onLoadTweets={async (source) => {
              const r = await api.listEvents(50, 1, source);
              return r.data;
            }}
          />
          <div style={{ borderTop: "1px solid var(--border)", marginTop: "1rem", paddingTop: "1rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.5rem" }}>Estudo de perfil</h3>
            <ProfileStudyCard onStudy={(h) => api.studyProfile(h)} />
          </div>
        </Step>

        {/* ─── Step 3: Analisar ─── */}
        <Step
          number={3}
          title="Analisar"
          description="Identificar tópicos e interesses nos tweets coletados"
          status={stepStatus(hasTopics, 3)}
          statusLabel={hasTopics ? `${topics.length} análises` : "analisar"}
          open={openStep === 3}
          onToggle={() => setOpenStep(openStep === 3 ? 0 : 3)}
        >
          <TopicsSection
            topics={topics}
            windowH={windowH}
            setWindowH={setWindowH}
            busy={busy === "analyze"}
            analysisSource={analysisSource}
            onAnalyze={() => run("analyze", async () => {
              const r = await api.analyze(windowH);
              setAnalysisSource(r.analysisSource);
              setMsg(`${r.summary}\n(${r.sampleSize} trechos analisados via ${r.analysisSource === "llm" ? "IA" : "heurística"})`);
            })}
          />
        </Step>

        {/* ─── Step 4: Rascunhar ─── */}
        <Step
          number={4}
          title="Rascunhar"
          description="Gerar posts originais baseados nos seus interesses"
          status={stepStatus(hasDrafts, 4)}
          statusLabel={hasDrafts ? `${drafts.length} rascunhos` : "gerar"}
          open={openStep === 4}
          onToggle={() => setOpenStep(openStep === 4 ? 0 : 4)}
        >
          {/* Ghostwriter — cola texto, gera posts */}
          <details style={{ marginBottom: "1rem" }}>
            <summary style={{ cursor: "pointer", fontSize: "0.9rem", fontWeight: 600, padding: "0.5rem 0", color: "var(--text-dim)" }}>
              Ghostwriter — transformar texto em posts
            </summary>
            <div style={{ marginTop: "0.5rem" }}>
              <GhostwriterCard
                busy={busy === "ghostwrite"}
                onGhostwrite={(text, format, count) => run("ghostwrite", async () => {
                  const r = await api.ghostwrite(text, format, count);
                  setMsg(`${r.drafts.length} posts gerados pelo ghostwriter.`);
                })}
              />
            </div>
          </details>

          <DraftsSection
            drafts={drafts}
            personas={personas}
            selectedPersonaId={selectedPersonaId}
            onSelectPersona={setSelectedPersonaId}
            tone={tone}
            setTone={setTone}
            count={draftCount}
            setCount={setDraftCount}
            format={draftFormat}
            setFormat={setDraftFormat}
            busy={busy === "draft"}
            mentorsUsed={mentorsUsed}
            onGenerate={() => run("draft", async () => {
              const r = await api.generateDrafts({
                windowHours: windowH,
                tone,
                count: draftCount,
                personaId: selectedPersonaId ?? undefined,
                format: draftFormat,
              });
              setMentorsUsed(r.mentorsUsed);
              const summary = r.drafts.map((d, i) => `${i + 1}. ${d.body}`).join("\n\n");
              setMsg(`${r.drafts.length} variações geradas.\nMentores: ${r.mentorsUsed.map(m => "@" + m).join(", ") || "nenhum detectado"}\n\n${summary}`);
            })}
            onScheduleDraft={(d) => {
              setScheduleBody(d.body);
              setScheduleDraftId(d.id);
              const t = new Date();
              t.setMinutes(t.getMinutes() + 2);
              setScheduleAt(t.toISOString().slice(0, 16));
              setOpenStep(5);
            }}
            onDiscardDraft={(id) => run("discard", async () => {
              await api.discardDraft(id);
            })}
            onEditDraft={(id, body) => run("edit", async () => {
              await api.patchDraft(id, { body });
              setMsg("Rascunho editado.");
            })}
          />
        </Step>

        {/* ─── Step 5: Agendar ─── */}
        <Step
          number={5}
          title="Agendar"
          description="Revisar, programar e publicar automaticamente"
          status={stepStatus(scheduled.some(s => s.status === "posted"), 5)}
          statusLabel={scheduled.length > 0 ? `${scheduled.length} na fila` : "agendar"}
          open={openStep === 5}
          onToggle={() => setOpenStep(openStep === 5 ? 0 : 5)}
        >
          <ScheduleSection
            scheduled={scheduled}
            scheduleBody={scheduleBody}
            setScheduleBody={setScheduleBody}
            scheduleAt={scheduleAt}
            setScheduleAt={setScheduleAt}
            busy={busy === "schedule" || busy === "cancel"}
            onSchedule={() => run("schedule", async () => {
              const runAt = new Date(scheduleAt).toISOString();
              await api.schedule(scheduleBody, runAt, scheduleDraftId ?? undefined);
              setMsg("Post agendado com sucesso.");
              setScheduleDraftId(null);
              setScheduleBody("");
              setScheduleAt("");
            })}
            onCancel={(id) => run("cancel", async () => {
              await api.cancelScheduled(id);
              setMsg("Agendamento cancelado.");
            })}
          />
        </Step>

        {/* ─── Step 6: Métricas ─── */}
        <Step
          number={6}
          title="Métricas"
          description="Acompanhe o desempenho dos seus posts e crescimento"
          status={stepStatus(metrics !== null && metrics.totalPosts > 0, 6)}
          statusLabel={metrics?.totalPosts ? `${metrics.totalPosts} posts` : "sem dados"}
          open={openStep === 6}
          onToggle={() => setOpenStep(openStep === 6 ? 0 : 6)}
        >
          <MetricsDashboard
            metrics={metrics}
            busy={busy === "metrics"}
            onCollect={() => run("metrics", async () => {
              const r = await api.collectMetrics();
              setMsg(`${r.collected} métricas coletadas.${r.errors.length > 0 ? ` Erros: ${r.errors.join(", ")}` : ""}`);
            })}
          />
        </Step>
      </div>

      {/* ─── Toast / feedback ─── */}
      {msg && (
        <div className="toast">
          <button className="toast-close" onClick={() => setMsg("")}>×</button>
          {msg}
        </div>
      )}
    </div>
  );
}
