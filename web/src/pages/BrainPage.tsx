import { useState } from "react";
import {
  Loader2, Plus, UserCircle, Scan, Trash2,
  Heart, RefreshCw, X as XIcon,
} from "lucide-react";
import { useAppStore } from "../store.js";
import { api } from "../api.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, timeAgo } from "@/lib/utils";
import type { Author } from "@shared/types.js";

type ProfileStudy = {
  handle: string;
  tweetCount: number;
  themes: string[];
  writingStyle: string;
  typicalFormat: string;
  engagementTips: string;
  summary: string;
};

const WINDOW_PRESETS = [
  { label: "6h", value: 6 },
  { label: "24h", value: 24 },
  { label: "48h", value: 48 },
  { label: "7d", value: 168 },
];

/* ── MentorCard ───────────────────────────── */

function MentorCard({
  author,
  syncStatus,
  busy,
  onSync,
  onRemove,
  onStudy,
}: {
  author: Author;
  syncStatus: string | null;
  busy: boolean;
  onSync: () => void;
  onRemove: () => void;
  onStudy: () => void;
}) {
  return (
    <Card className="transition-all duration-150 hover:border-muted-foreground/30">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm font-bold">
            {author.handle[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <div className="font-mono text-sm font-semibold text-primary truncate">@{author.handle}</div>
            {author.display_name && (
              <div className="text-xs text-muted-foreground truncate">{author.display_name}</div>
            )}
          </div>
        </div>
        {syncStatus && (
          <p className="text-[0.68rem] font-mono text-muted-foreground mb-3">
            Ultima coleta: {syncStatus}
          </p>
        )}
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" disabled={busy} onClick={onStudy} className="h-7 flex-1">
            <Scan className="size-3" />
            Raio-X
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={onSync} className="h-7 flex-1">
            {busy ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
            Coletar
          </Button>
          <Button size="sm" variant="destructive" disabled={busy} onClick={onRemove} className="h-7">
            <Trash2 className="size-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── StyleXRayDrawer ──────────────────────── */

function StyleXRayDrawer({
  study,
  onClose,
}: {
  study: ProfileStudy;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/50 animate-in fade-in duration-200" onClick={onClose} />
      <div className="fixed top-0 right-0 z-[201] h-screen w-[420px] max-w-[90vw] overflow-y-auto border-l border-border bg-card p-6 animate-in slide-in-from-right duration-250">
        <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4 h-8 w-8">
          <XIcon className="size-4" />
        </Button>

        <h2 className="text-lg font-bold mb-1">@{study.handle}</h2>
        <p className="text-sm text-muted-foreground mb-5">
          {study.tweetCount} tweets analisados
        </p>

        {study.summary && (
          <div className="mb-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Resumo</h4>
            <p className="text-sm leading-relaxed">{study.summary}</p>
          </div>
        )}

        {study.themes.length > 0 && (
          <div className="mb-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Temas</h4>
            <div className="flex flex-wrap gap-1.5">
              {study.themes.map((t, i) => (
                <Badge key={i} variant="primary">{t}</Badge>
              ))}
            </div>
          </div>
        )}

        {study.writingStyle && (
          <div className="mb-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Estilo de escrita</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{study.writingStyle}</p>
          </div>
        )}

        {study.typicalFormat && (
          <div className="mb-5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Formato tipico</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{study.typicalFormat}</p>
          </div>
        )}

        {study.engagementTips && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Dicas de engajamento</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{study.engagementTips}</p>
          </div>
        )}
      </div>
    </>
  );
}

/* ── BrainPage ────────────────────────────── */

export function BrainPage() {
  const authors = useAppStore((s) => s.authors);
  const collectionStats = useAppStore((s) => s.collectionStats);
  const topics = useAppStore((s) => s.topics);
  const windowH = useAppStore((s) => s.windowH);
  const setWindowH = useAppStore((s) => s.setWindowH);
  const analysisSource = useAppStore((s) => s.analysisSource);
  const setAnalysisSource = useAppStore((s) => s.setAnalysisSource);
  const busy = useAppStore((s) => s.busy);
  const run = useAppStore((s) => s.run);
  const setMsg = useAppStore((s) => s.setMsg);

  const [newHandle, setNewHandle] = useState("");
  const [studyLoading, setStudyLoading] = useState<string | null>(null);
  const [studyResult, setStudyResult] = useState<ProfileStudy | null>(null);
  const [depth, setDepth] = useState(15);
  const maxTweets = depth * 10;

  function getSyncStatus(handle: string): string | null {
    const stat = collectionStats.find((s) => s.source === `profile:${handle}`);
    return stat ? timeAgo(stat.latest) : null;
  }

  async function handleAddAuthor() {
    if (!newHandle.trim()) return;
    await run("author", async () => { await api.addAuthor(newHandle.replace(/^@/, "")); setNewHandle(""); });
  }

  async function handleRemoveAuthor(handle: string) { await run("del", () => api.deleteAuthor(handle)); }
  async function handleSyncProfile(handle: string) { await run("profile", async () => { await api.syncProfile(handle, depth, maxTweets); setMsg(`@${handle} coletado.`); }); }
  async function handleSyncLikes() { await run("likes", async () => { await api.syncLikes(depth, maxTweets); setMsg("Curtidas coletadas."); }); }
  async function handleSyncWatchlist() { await run("watchlist", async () => { await api.syncWatchlist(); setMsg("Watchlist coletada."); }); }

  async function handleStudy(handle: string) {
    setStudyLoading(handle);
    try {
      setStudyResult(await api.studyProfile(handle));
    } catch (e) {
      setStudyResult({ handle, tweetCount: 0, themes: [], writingStyle: "", typicalFormat: "", engagementTips: "", summary: e instanceof Error ? e.message : "Erro" });
    }
    setStudyLoading(null);
  }

  async function handleAnalyze() {
    await run("analyze", async () => {
      const r = await api.analyze(windowH);
      setAnalysisSource(r.analysisSource);
      setMsg(`${r.summary}\n(${r.sampleSize} trechos via ${r.analysisSource === "llm" ? "IA" : "heuristica"})`);
    });
  }

  const isBusy = !!busy;
  const latest = topics[0];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Cerebro</h1>
        <p className="text-sm text-muted-foreground">Mentores, analise de estilo e configuracao do agente</p>
      </div>

      {/* Add mentor */}
      <div className="flex gap-2 mb-5">
        <Input
          placeholder="@handle para monitorar"
          value={newHandle}
          onChange={(e) => setNewHandle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddAuthor()}
          className="h-9"
        />
        <Button disabled={isBusy || !newHandle.trim()} onClick={handleAddAuthor}>
          <Plus className="size-4" />
          Adicionar
        </Button>
      </div>

      {/* Mentor Grid */}
      {authors.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 mb-5 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((a) => (
            <MentorCard
              key={a.id}
              author={a}
              syncStatus={getSyncStatus(a.handle)}
              busy={isBusy || studyLoading === a.handle}
              onSync={() => handleSyncProfile(a.handle)}
              onRemove={() => handleRemoveAuthor(a.handle)}
              onStudy={() => handleStudy(a.handle)}
            />
          ))}
        </div>
      ) : (
        <Card className="mb-5 border-dashed">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Adicione perfis para monitorar e aprender seu estilo.
          </CardContent>
        </Card>
      )}

      {/* Bulk actions */}
      <div className="flex gap-2 mb-6">
        <Button variant="outline" disabled={isBusy} onClick={handleSyncLikes} className="flex-1">
          {busy === "likes" ? <Loader2 className="size-4 animate-spin" /> : <Heart className="size-4" />}
          Coletar curtidas
        </Button>
        {authors.length > 0 && (
          <Button variant="outline" disabled={isBusy} onClick={handleSyncWatchlist} className="flex-1">
            {busy === "watchlist" ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Coletar watchlist ({authors.length})
          </Button>
        )}
      </div>

      {/* Agent Config */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Configuracao do Agente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <div className="text-sm">Profundidade de coleta</div>
              <div className="text-xs text-muted-foreground">{depth} scrolls (~{maxTweets} tweets)</div>
            </div>
            <input
              type="range"
              min={3}
              max={50}
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="w-28 accent-[#38bdf8]"
            />
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="text-sm">Periodo de analise</div>
            <div className="flex gap-1.5">
              {WINDOW_PRESETS.map((p) => (
                <Button
                  key={p.value}
                  size="sm"
                  variant={windowH === p.value ? "primary" : "outline"}
                  onClick={() => setWindowH(p.value)}
                  className="h-7 px-2.5"
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>
          <Button variant="primary" disabled={busy === "analyze"} onClick={handleAnalyze} className="w-full mt-3">
            {busy === "analyze" ? <Loader2 className="size-4 animate-spin" /> : null}
            Analisar ultimas {windowH}h
          </Button>
        </CardContent>
      </Card>

      {/* Latest analysis */}
      {latest && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle>Ultima analise</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={analysisSource === "llm" ? "success" : "warning"}>
                  {analysisSource === "llm" ? "IA" : "heuristica"}
                </Badge>
                <span className="text-[0.68rem] font-mono text-muted-foreground">
                  {latest.window_hours}h / {new Date(latest.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3">{latest.summary}</p>
            {latest.topics_json && (() => {
              const tags = JSON.parse(latest.topics_json) as string[];
              return tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t, i) => (
                    <Badge key={i} variant="primary">{t}</Badge>
                  ))}
                </div>
              ) : null;
            })()}
          </CardContent>
        </Card>
      )}

      {/* Collection stats */}
      {collectionStats.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Base de conhecimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {collectionStats.map((s, i) => (
                <div key={s.source}>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="font-mono text-sm text-primary">
                      {s.source === "likes" ? "Minhas curtidas" : s.source.replace("profile:", "@")}
                    </span>
                    <div className="flex items-center gap-3">
                      {s.hasMedia > 0 && (
                        <span className="text-[0.7rem] text-muted-foreground">{s.hasMedia} midia</span>
                      )}
                      <span className="font-mono text-sm font-semibold">{s.count}</span>
                      <span className="text-[0.68rem] text-muted-foreground">{timeAgo(s.latest)}</span>
                    </div>
                  </div>
                  {i < collectionStats.length - 1 && <Separator />}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-md bg-background p-3">
              <span className="text-sm text-muted-foreground">Total na base</span>
              <span className="font-mono text-sm font-bold text-primary">
                {collectionStats.reduce((a, s) => a + s.count, 0)} tweets
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* X-Ray drawer */}
      {studyResult && (
        <StyleXRayDrawer study={studyResult} onClose={() => setStudyResult(null)} />
      )}
    </div>
  );
}
