import { useState } from "react";
import { Loader2, Trash2, PenLine, CalendarClock, ChevronDown, Sparkles, Ghost } from "lucide-react";
import { useAppStore } from "../store.js";
import { api } from "../api.js";
import { TweetPreview } from "../components/TweetPreview.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Draft, Persona } from "@shared/types.js";

type PostFormat = "short" | "long" | "thread";

const FORMAT_OPTIONS: { value: PostFormat; label: string; desc: string }[] = [
  { value: "short", label: "Curto", desc: "280" },
  { value: "long", label: "Longo", desc: "4000" },
  { value: "thread", label: "Thread", desc: "3-5" },
];

/* ── TweetCard ────────────────────────────── */

function TweetCard({
  draft,
  persona,
  onSchedule,
  onDiscard,
  onEdit,
}: {
  draft: Draft;
  persona: Persona | undefined;
  onSchedule: (runAt: string) => void;
  onDiscard: () => void;
  onEdit: (body: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(draft.body);
  const [scheduleAt, setScheduleAt] = useState(() => {
    const t = new Date();
    t.setMinutes(t.getMinutes() + 5);
    return t.toISOString().slice(0, 16);
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const isThread = draft.body.includes("\n---\n");

  async function handleAction(name: string, fn: () => void | Promise<void>) {
    if (actionLoading) return;
    setActionLoading(name);
    try { await fn(); } finally { setActionLoading(null); }
  }

  const statusMap: Record<string, { label: string; variant: "warning" | "success" | "destructive" | "default" }> = {
    pending_approval: { label: "Pendente", variant: "warning" },
    draft: { label: "Rascunho", variant: "default" },
    scheduled: { label: "Agendado", variant: "primary" as "default" },
    posted: { label: "Publicado", variant: "success" },
    failed: { label: "Falhou", variant: "destructive" },
    discarded: { label: "Descartado", variant: "default" },
  };

  const status = statusMap[draft.status] ?? { label: draft.status, variant: "default" as const };

  return (
    <Card className="overflow-hidden transition-all duration-150 hover:border-muted-foreground/30 hover:shadow-lg hover:shadow-primary/5">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Badge variant={status.variant}>{status.label}</Badge>
          {persona && (
            <span className="text-[0.68rem] text-muted-foreground">
              {persona.icon} {persona.name}
            </span>
          )}
        </div>
        <span className="text-[0.65rem] font-mono text-muted-foreground">
          {editText.length} chars
        </span>
      </div>

      {/* Body */}
      {editing ? (
        <div className="p-3">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="min-h-[80px] text-sm"
          />
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              variant="primary"
              disabled={!!actionLoading}
              onClick={() => handleAction("save", () => { onEdit(editText); setEditing(false); })}
            >
              {actionLoading === "save" ? <Loader2 className="size-3 animate-spin" /> : null}
              Salvar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditText(draft.body); setEditing(false); }}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <TweetPreview body={draft.body} isThread={isThread} />
      )}

      {/* Actions — always visible */}
      {!editing && (
        <div className="flex items-center gap-1.5 px-3 py-2 border-t border-border">
          <Button
            size="sm"
            variant="destructive"
            disabled={!!actionLoading}
            onClick={() => handleAction("discard", onDiscard)}
            className="h-7"
          >
            {actionLoading === "discard" ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
            <span className="hidden sm:inline">Descartar</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!!actionLoading}
            onClick={() => setEditing(true)}
            className="h-7"
          >
            <PenLine className="size-3" />
            <span className="hidden sm:inline">Editar</span>
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="primary" disabled={!!actionLoading} className="h-7 ml-auto">
                <CalendarClock className="size-3" />
                Agendar
                <ChevronDown className="size-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Data e hora
                  </label>
                  <Input
                    type="datetime-local"
                    value={scheduleAt}
                    onChange={(e) => setScheduleAt(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  className="w-full"
                  disabled={!!actionLoading || !scheduleAt}
                  onClick={() => handleAction("schedule", () => {
                    onSchedule(new Date(scheduleAt).toISOString());
                  })}
                >
                  {actionLoading === "schedule" ? <Loader2 className="size-3 animate-spin" /> : null}
                  Confirmar agendamento
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Meta */}
      <div className="px-3 pb-2">
        {draft.similarity_note && (
          <p className="text-[0.7rem] text-warning mb-1">{draft.similarity_note}</p>
        )}
        <p className="text-[0.65rem] font-mono text-muted-foreground/60">
          {new Date(draft.created_at).toLocaleString("pt-BR")}
        </p>
      </div>
    </Card>
  );
}

/* ── ScheduledCard ────────────────────────── */

function ScheduledCard({
  post,
  onCancel,
}: {
  post: { id: string; body: string; run_at: string; status: string; last_error: string | null; tweet_url: string | null };
  onCancel: () => void;
}) {
  const isThread = post.body.includes("\n---\n");
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <Badge variant={post.status === "posted" ? "success" : post.status === "failed" ? "destructive" : "warning"}>
          {post.status === "posted" ? "Publicado" : post.status === "failed" ? "Falhou" : "Agendado"}
        </Badge>
        <span className="text-[0.65rem] font-mono text-muted-foreground">
          {new Date(post.run_at).toLocaleString("pt-BR")}
        </span>
      </div>
      <TweetPreview body={post.body} isThread={isThread} />
      {post.last_error && (
        <p className="px-3 py-1 text-[0.7rem] text-destructive">{post.last_error}</p>
      )}
      {post.status === "scheduled" && (
        <div className="px-3 py-2 border-t border-border">
          <Button size="sm" variant="destructive" onClick={onCancel} className="h-7">
            Cancelar
          </Button>
        </div>
      )}
    </Card>
  );
}

/* ── KanbanColumn ─────────────────────────── */

function KanbanColumn({
  title,
  count,
  dotColor,
  children,
}: {
  title: string;
  count: number;
  dotColor: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col min-h-[300px]">
      <CardHeader className="pb-0 pt-3 px-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("size-2 rounded-full", dotColor)} />
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
          </div>
          <span className="text-[0.68rem] font-mono font-bold text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
            {count}
          </span>
        </div>
      </CardHeader>
      <ScrollArea className="flex-1 p-2">
        <div className="flex flex-col gap-2 min-h-[200px]">
          {children}
        </div>
      </ScrollArea>
    </Card>
  );
}

/* ── StudioPage ───────────────────────────── */

export function StudioPage() {
  const drafts = useAppStore((s) => s.drafts);
  const scheduled = useAppStore((s) => s.scheduled);
  const personas = useAppStore((s) => s.personas);
  const selectedPersonaId = useAppStore((s) => s.selectedPersonaId);
  const setSelectedPersonaId = useAppStore((s) => s.setSelectedPersonaId);
  const tone = useAppStore((s) => s.tone);
  const setTone = useAppStore((s) => s.setTone);
  const draftCount = useAppStore((s) => s.draftCount);
  const setDraftCount = useAppStore((s) => s.setDraftCount);
  const draftFormat = useAppStore((s) => s.draftFormat);
  const setDraftFormat = useAppStore((s) => s.setDraftFormat);
  const windowH = useAppStore((s) => s.windowH);
  const busy = useAppStore((s) => s.busy);
  const mentorsUsed = useAppStore((s) => s.mentorsUsed);
  const run = useAppStore((s) => s.run);
  const setMentorsUsed = useAppStore((s) => s.setMentorsUsed);
  const setMsg = useAppStore((s) => s.setMsg);

  const selectedPersona = personas.find((p) => p.id === selectedPersonaId);

  const pendingDrafts = drafts.filter((d) => d.status === "pending_approval" || d.status === "draft");
  const scheduledPosts = scheduled.filter((s) => s.status === "scheduled");
  const postedPosts = scheduled.filter((s) => s.status === "posted" || s.status === "failed");

  const [ghostText, setGhostText] = useState("");
  const [showGhostwriter, setShowGhostwriter] = useState(false);

  async function handleGenerate() {
    await run("draft", async () => {
      const r = await api.generateDrafts({
        windowHours: windowH, tone, count: draftCount,
        personaId: selectedPersonaId ?? undefined, format: draftFormat,
      });
      setMentorsUsed(r.mentorsUsed);
      setMsg(`${r.drafts.length} variacoes geradas. Mentores: ${r.mentorsUsed.map((m) => "@" + m).join(", ") || "nenhum"}`);
    });
  }

  async function handleGhostwrite() {
    await run("ghostwrite", async () => {
      const r = await api.ghostwrite(ghostText, draftFormat, draftCount);
      setMsg(`${r.drafts.length} posts gerados pelo ghostwriter.`);
    });
  }

  async function handleScheduleDraft(draftId: string, body: string, runAt: string) {
    await run("schedule", async () => { await api.schedule(body, runAt, draftId); setMsg("Post agendado."); });
  }

  async function handleDiscard(id: string) {
    await run("discard", async () => { await api.discardDraft(id); });
  }

  async function handleEdit(id: string, body: string) {
    await run("edit", async () => { await api.patchDraft(id, { body }); setMsg("Rascunho editado."); });
  }

  async function handleCancel(id: string) {
    await run("cancel", async () => { await api.cancelScheduled(id); setMsg("Agendamento cancelado."); });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Studio</h1>
        <p className="text-sm text-muted-foreground">Crie, revise e publique seus posts</p>
      </div>

      <div className="flex gap-4 items-start max-[900px]:flex-col-reverse">
        {/* Kanban */}
        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-3 gap-3 max-[900px]:grid-cols-1">
            <KanbanColumn title="Ideias" count={pendingDrafts.length} dotColor="bg-warning">
              {pendingDrafts.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground/50 p-4 text-center">
                  Gere rascunhos no painel lateral
                </div>
              ) : (
                pendingDrafts.map((d) => (
                  <TweetCard
                    key={d.id}
                    draft={d}
                    persona={personas.find((p) => p.id === d.persona_id)}
                    onSchedule={(runAt) => handleScheduleDraft(d.id, d.body, runAt)}
                    onDiscard={() => handleDiscard(d.id)}
                    onEdit={(body) => handleEdit(d.id, body)}
                  />
                ))
              )}
            </KanbanColumn>

            <KanbanColumn title="Na Fila" count={scheduledPosts.length} dotColor="bg-primary">
              {scheduledPosts.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground/50 p-4 text-center">
                  Aprove rascunhos para agendar
                </div>
              ) : (
                scheduledPosts.map((s) => (
                  <ScheduledCard key={s.id} post={s} onCancel={() => handleCancel(s.id)} />
                ))
              )}
            </KanbanColumn>

            <KanbanColumn title="Publicados" count={postedPosts.length} dotColor="bg-success">
              {postedPosts.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground/50 p-4 text-center">
                  Posts publicados aparecem aqui
                </div>
              ) : (
                postedPosts.map((s) => (
                  <ScheduledCard key={s.id} post={s} onCancel={() => {}} />
                ))
              )}
            </KanbanColumn>
          </div>
        </div>

        {/* Persona Toolbar */}
        <div className="w-[280px] shrink-0 sticky top-4 max-[900px]:w-full max-[900px]:static">
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Personas */}
              {personas.length > 0 && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                    Persona
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {personas.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPersonaId(selectedPersonaId === p.id ? null : p.id)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-lg border p-2.5 text-xs font-medium transition-all duration-150 cursor-pointer",
                          selectedPersonaId === p.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-secondary text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                        )}
                      >
                        <span className="text-lg">{p.icon}</span>
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                  {selectedPersona && (
                    <p className="text-[0.7rem] text-muted-foreground mt-2">{selectedPersona.description}</p>
                  )}
                </div>
              )}

              <Separator />

              {/* Tone */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Tom {selectedPersona ? `(${selectedPersona.name})` : ""}
                </label>
                <Input
                  value={selectedPersona ? selectedPersona.tone : tone}
                  onChange={(e) => setTone(e.target.value)}
                  disabled={!!selectedPersona}
                  className={cn("h-8 text-sm", selectedPersona && "opacity-60")}
                />
              </div>

              {/* Format */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Formato
                </label>
                <div className="flex gap-1.5">
                  {FORMAT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDraftFormat(opt.value)}
                      className={cn(
                        "flex-1 rounded-md border py-1.5 text-center text-xs font-medium transition-all cursor-pointer",
                        draftFormat === opt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary text-muted-foreground hover:border-muted-foreground/30"
                      )}
                    >
                      <div>{opt.label}</div>
                      <div className="text-[0.6rem] opacity-60">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Count */}
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                  Variacoes
                </label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={draftCount}
                  onChange={(e) => setDraftCount(Number(e.target.value))}
                  className="h-8 text-sm"
                />
              </div>

              {/* Generate */}
              <Button
                variant="primary"
                disabled={busy === "draft"}
                onClick={handleGenerate}
                className="w-full"
              >
                {busy === "draft" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                Gerar {draftCount} variacoes
              </Button>

              {mentorsUsed.length > 0 && (
                <p className="text-[0.7rem] text-muted-foreground">
                  Mentores: {mentorsUsed.map((m) => `@${m}`).join(", ")}
                </p>
              )}

              <Separator />

              {/* Ghostwriter */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGhostwriter(!showGhostwriter)}
                className="w-full justify-start text-muted-foreground"
              >
                <Ghost className="size-3.5" />
                Ghostwriter
                <ChevronDown className={cn("size-3 ml-auto transition-transform", showGhostwriter && "rotate-180")} />
              </Button>
              {showGhostwriter && (
                <div className="space-y-2 animate-in slide-in-from-top-1 duration-150">
                  <Textarea
                    value={ghostText}
                    onChange={(e) => setGhostText(e.target.value)}
                    placeholder="Cole um texto para transformar em posts..."
                    className="min-h-[80px] text-sm"
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    disabled={busy === "ghostwrite" || ghostText.trim().length < 10}
                    onClick={handleGhostwrite}
                    className="w-full"
                  >
                    {busy === "ghostwrite" ? <Loader2 className="size-3 animate-spin" /> : null}
                    Gerar {draftCount} posts
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
