import { useNavigate } from "react-router-dom";
import {
  PenLine, Heart, Eye, Users, ArrowRight,
  Clock, CheckCircle2, XCircle, UserCircle,
} from "lucide-react";
import { useAppStore } from "../store.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn, formatNumber, timeAgo } from "@/lib/utils";

export function CockpitPage() {
  const navigate = useNavigate();
  const drafts = useAppStore((s) => s.drafts);
  const scheduled = useAppStore((s) => s.scheduled);
  const metrics = useAppStore((s) => s.metrics);
  const collectionStats = useAppStore((s) => s.collectionStats);
  const authors = useAppStore((s) => s.authors);

  const pendingDrafts = drafts.filter(
    (d) => d.status === "pending_approval" || d.status === "draft"
  );
  const postedCount = scheduled.filter((s) => s.status === "posted").length;
  const scheduledCount = scheduled.filter((s) => s.status === "scheduled").length;
  const totalCollected = collectionStats.reduce((a, s) => a + s.count, 0);

  // Build activity log
  const activities: { icon: "heart" | "user" | "check" | "x" | "clock"; text: string; time: string }[] = [];
  for (const stat of collectionStats.slice(0, 5)) {
    const label = stat.source === "likes" ? "Curtidas coletadas" : `@${stat.source.replace("profile:", "")} coletado`;
    activities.push({ icon: stat.source === "likes" ? "heart" : "user", text: `${label} (${stat.count} tweets)`, time: stat.latest });
  }
  for (const s of scheduled.slice(0, 3)) {
    activities.push({
      icon: s.status === "posted" ? "check" : s.status === "failed" ? "x" : "clock",
      text: s.status === "posted" ? "Post publicado" : s.status === "failed" ? `Falha: ${s.last_error ?? "erro"}` : "Agendado para publicacao",
      time: s.run_at,
    });
  }
  activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const iconMap = {
    heart: <Heart className="size-3.5 text-destructive" />,
    user: <UserCircle className="size-3.5 text-primary" />,
    check: <CheckCircle2 className="size-3.5 text-success" />,
    x: <XCircle className="size-3.5 text-destructive" />,
    clock: <Clock className="size-3.5 text-warning" />,
  };

  const stats = [
    { icon: PenLine, label: "Publicados", value: postedCount, color: "text-primary" },
    { icon: Heart, label: "Likes", value: metrics?.totalLikes ?? 0, color: "text-destructive" },
    { icon: Eye, label: "Views", value: metrics?.totalViews ?? 0, color: "text-primary" },
    { icon: Users, label: "Mentores", value: authors.length, color: "text-success" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Cockpit</h1>
        <p className="text-sm text-muted-foreground">Visao geral do seu motor de crescimento</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="bg-background border-border">
            <CardContent className="p-4 text-center">
              <s.icon className={cn("size-5 mx-auto mb-1.5", s.color)} />
              <div className="font-mono text-2xl font-bold text-primary">{formatNumber(s.value)}</div>
              <div className="text-[0.7rem] uppercase tracking-wider text-muted-foreground mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Inbox */}
      <Card className={cn(
        "mb-6 transition-colors",
        pendingDrafts.length > 0 && "border-primary/30 bg-primary/[0.03]"
      )}>
        <CardContent className="flex items-center gap-5 p-5">
          <div className="font-mono text-4xl font-bold text-primary leading-none">
            {pendingDrafts.length}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">
              {pendingDrafts.length > 0 ? "Rascunhos aguardando revisao" : "Nenhum rascunho pendente"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pendingDrafts.length > 0
                ? "Revise, edite e aprove para publicacao"
                : scheduledCount > 0
                  ? `${scheduledCount} post${scheduledCount > 1 ? "s" : ""} na fila`
                  : "Gere novos rascunhos no Studio"}
            </p>
          </div>
          <Button variant="primary" onClick={() => navigate("/studio")}>
            {pendingDrafts.length > 0 ? "Revisar" : "Criar"}
            <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Gamification */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="font-mono text-3xl font-bold text-primary">{formatNumber(totalCollected)}</div>
            <div className="text-sm font-medium mt-1">Tweets na base</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {collectionStats.length} fonte{collectionStats.length !== 1 ? "s" : ""} monitorada{collectionStats.length !== 1 ? "s" : ""}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="font-mono text-3xl font-bold text-primary">{scheduledCount}</div>
            <div className="text-sm font-medium mt-1">Na fila</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {postedCount} publicado{postedCount !== 1 ? "s" : ""} no total
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Log */}
      {activities.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
              Atividade recente
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {activities.slice(0, 8).map((a, i) => (
              <div key={i}>
                <div className="flex items-start gap-3 py-2.5">
                  <span className="mt-0.5">{iconMap[a.icon]}</span>
                  <span className="flex-1 text-sm text-muted-foreground">{a.text}</span>
                  <span className="text-[0.68rem] font-mono text-muted-foreground/60 whitespace-nowrap">
                    {timeAgo(a.time)}
                  </span>
                </div>
                {i < activities.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Best post */}
      {metrics?.bestPost && (
        <Card className="mt-4 border-success/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="success">melhor post</Badge>
              <span className="text-xs text-muted-foreground">
                {formatNumber(metrics.bestPost.likes)} likes / {formatNumber(metrics.bestPost.views)} views
              </span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{metrics.bestPost.body}</p>
            <p className="text-[0.68rem] font-mono text-muted-foreground mt-2">
              {new Date(metrics.bestPost.run_at).toLocaleString("pt-BR")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
