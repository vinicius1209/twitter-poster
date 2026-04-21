import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import {
  openaiApiKey,
  openaiEmbeddingModel,
  openaiModel,
  LLM_PROMPT_MAX_CHARS,
  LLM_SAMPLE_SIZE,
  MAX_TWEET_LENGTH,
} from "../config.js";
import { summarizeHeuristic } from "./heuristicTopics.js";
import { insertLlmLog } from "../db/repositories/llmLogs.repo.js";

/** Helper para logar chamadas OpenAI */
async function loggedCall<T>(
  operation: string,
  promptPreview: string,
  fn: () => Promise<T & { usage?: { prompt_tokens?: number; completion_tokens?: number } }>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const usage = (result as any)?.usage;
    insertLlmLog({
      id: randomUUID(),
      operation,
      model: openaiModel,
      promptPreview,
      responsePreview: JSON.stringify(result).slice(0, 500),
      tokensIn: usage?.prompt_tokens ?? 0,
      tokensOut: usage?.completion_tokens ?? 0,
      durationMs: Date.now() - start,
      error: null,
    });
    return result;
  } catch (err) {
    insertLlmLog({
      id: randomUUID(),
      operation,
      model: openaiModel,
      promptPreview,
      responsePreview: null,
      tokensIn: 0,
      tokensOut: 0,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

let client: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (!openaiApiKey) return null;
  if (!client) {
    client = new OpenAI({ apiKey: openaiApiKey });
  }
  return client;
}

export async function analyzeTopicsWithLlm(
  texts: string[],
  windowHours: number,
): Promise<{ summary: string; topics: string[]; source: "llm" | "heuristic" }> {
  const c = getClient();
  if (!c || texts.length === 0) {
    console.log("[analyze] sem OpenAI client ou textos vazios, usando heurística");
    return { ...summarizeHeuristic(texts, windowHours), source: "heuristic" };
  }

  const sample = texts.slice(0, LLM_SAMPLE_SIZE).join("\n---\n");
  const prompt = `Analise estes tweets que o usuário curtiu/leu nas últimas ${windowHours}h.

Extraia:
1. De 5 a 10 tópicos curtos (2-4 palavras cada) que representam os TEMAS reais (não palavras soltas)
2. Um parágrafo resumindo as tendências, interesses e padrões do usuário

Os tópicos devem ser significativos (ex: "experiência do usuário", "automação com IA", "crescimento de produto") — NÃO palavras genéricas como "app", "data", "design".

Responda APENAS JSON válido:
{"topics":["tópico 1","tópico 2",...],"summary":"resumo aqui"}

Tweets:
${sample.slice(0, LLM_PROMPT_MAX_CHARS)}`;

  try {
    console.log("[analyze] chamando OpenAI com", texts.length, "textos...");
    const res = await loggedCall("analyzeTopics", prompt.slice(0, 200), () =>
      c.chat.completions.create({
        model: openaiModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
      })
    );
    const raw = res.choices[0]?.message?.content?.trim() ?? "";
    console.log("[analyze] resposta OpenAI:", raw.slice(0, 200));

    // Tenta extrair JSON mesmo se vier com markdown
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log("[analyze] JSON não encontrado na resposta, fallback heurístico");
      return { ...summarizeHeuristic(texts, windowHours), source: "heuristic" };
    }

    const json = JSON.parse(jsonMatch[0]) as { topics?: string[]; summary?: string };
    return {
      topics: Array.isArray(json.topics) ? json.topics : [],
      summary: json.summary ?? raw,
      source: "llm",
    };
  } catch (err) {
    console.error("[analyze] erro na chamada OpenAI:", err instanceof Error ? err.message : err);
    return { ...summarizeHeuristic(texts, windowHours), source: "heuristic" };
  }
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const c = getClient();
  if (!c || texts.length === 0) return [];
  const res = await c.embeddings.create({
    model: openaiEmbeddingModel,
    input: texts,
  });
  return res.data.map((d) => d.embedding as number[]);
}

export function maxCosineSimilarity(a: number[], vectors: number[][]): number {
  if (!a.length || !vectors.length) return 0;
  let max = 0;
  for (const b of vectors) {
    const s = cosineSimilarity(a, b);
    if (s > max) max = s;
  }
  return max;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
}

export type PostFormat = "short" | "long" | "thread";

/**
 * Trunca texto de forma inteligente — corta no último ponto final,
 * exclamação, interrogação ou quebra de linha ANTES do limite.
 * Nunca corta no meio de uma palavra.
 */
function smartTruncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;

  // Procura o último terminador de frase antes do limite
  const chunk = text.slice(0, maxLen);
  const lastSentenceEnd = Math.max(
    chunk.lastIndexOf(". "),
    chunk.lastIndexOf(".\n"),
    chunk.lastIndexOf("! "),
    chunk.lastIndexOf("!\n"),
    chunk.lastIndexOf("? "),
    chunk.lastIndexOf("?\n"),
    chunk.lastIndexOf("."),
    chunk.lastIndexOf("!"),
    chunk.lastIndexOf("?"),
  );

  if (lastSentenceEnd > maxLen * 0.5) {
    // Corta no fim da frase (inclui o ponto)
    return chunk.slice(0, lastSentenceEnd + 1).trim();
  }

  // Se não encontrou ponto, corta no último espaço
  const lastSpace = chunk.lastIndexOf(" ");
  if (lastSpace > maxLen * 0.5) {
    return chunk.slice(0, lastSpace).trim() + "…";
  }

  return chunk.trim();
}

export type DraftGenerationParams = {
  topicsSummary: string;
  exampleSnippets: string[];
  tone: string;
  count: number;
  format: PostFormat;
  maxChars: number;
  mentors: {
    handle: string;
    score: number;
    sampleTweets: string[];
    learnedStyle?: { tone: string | null; patterns: string | null; phrases: string | null };
  }[];
  existingDrafts: string[];
  systemPrompt?: string;
};

/**
 * Gera N variações distintas de posts, usando contexto de mentores
 * e evitando repetição com drafts existentes.
 */
export async function generateDraftsWithLlm(params: DraftGenerationParams): Promise<string[]> {
  const c = getClient();
  const {
    topicsSummary, exampleSnippets, tone, count, format, maxChars,
    mentors, existingDrafts,
  } = params;

  const snippets = exampleSnippets.slice(0, 8).join("\n---\n");

  if (!c) {
    return Array.from({ length: count }, (_, i) =>
      `Post ${i + 1} (${tone}): reflexão sobre: ${topicsSummary.slice(0, 150)}. O que muda na prática?`
    );
  }

  // Monta seção de mentores — com estilo aprendido quando disponível
  let mentorSection = "";
  if (mentors.length > 0) {
    const mentorLines = mentors.slice(0, 5).map(m => {
      const samples = m.sampleTweets.slice(0, 3).join("\n  ");
      let line = `@${m.handle} (engajamento: ${m.score.toFixed(0)}):\n  ${samples}`;
      if (m.learnedStyle) {
        if (m.learnedStyle.tone) line += `\n  Tom: ${m.learnedStyle.tone}`;
        if (m.learnedStyle.patterns) line += `\n  Padrões: ${m.learnedStyle.patterns}`;
        if (m.learnedStyle.phrases) line += `\n  Frases típicas: ${m.learnedStyle.phrases}`;
      }
      return line;
    }).join("\n\n");
    mentorSection = `\nSeus mentores/referências — o app APRENDEU o estilo deles:
${mentorLines}

Absorva o tom e os padrões de escrita desses autores, mas com sua própria voz. NÃO copie frases.`;
  }

  let avoidSection = "";
  if (existingDrafts.length > 0) {
    avoidSection = `\nPosts já gerados (NÃO repita estes — cada variação deve ter ângulo, estrutura e punchline DIFERENTES):
${existingDrafts.slice(0, 5).map((d, i) => `${i + 1}. ${d}`).join("\n")}`;
  }

  // Instruções de formato
  const formatInstructions: Record<PostFormat, string> = {
    short: `REGRA CRÍTICA: Cada post deve ter NO MÁXIMO ${maxChars} caracteres INCLUINDO espaços e quebras de linha. Conte os caracteres antes de responder.

Para 280 chars, escreva de forma natural e fluida — 2 a 4 frases curtas. NÃO quebre cada frase em uma nova linha. Use no máximo 1-2 quebras de linha para separar a ideia central do fechamento.

O post deve ser COMPLETO — nunca cortado no meio de uma palavra ou frase.`,

    long: `Pode ter até ${maxChars} caracteres. Aproveite o espaço com PROFUNDIDADE.

FORMATAÇÃO VISUAL (isso define retenção no X):
- Comece com 1 linha forte que faz parar de scrollar
- Separe blocos de ideia com linha em branco
- Frases curtas (40-60 chars por linha)
- Use → para listas ou passos
- Feche com 1 frase impactante isolada
- NÃO escreva um bloco de texto sem quebras
- O post deve ser COMPLETO — nunca cortado no meio`,

    thread: `THREAD de 3 a 5 posts conectados. Separe cada post com "---".
- Post 1: gancho irresistível, 1-2 linhas
- Posts intermediários: uma ideia por post, com quebras visuais
- Último post: insight principal isolado
- Cada post pode ter até 280 chars
- Use frases curtas e quebras de linha dentro de cada post
- Total máximo: ${maxChars} caracteres`,
  };

  const prompt = `Escreva ${count} ${format === "thread" ? "threads" : "posts"} DISTINTOS para o X, em português brasileiro.
Tom: ${tone}
Formato: ${formatInstructions[format]}

PROIBIDO (isso mata o engajamento):
- Call to action genérica no final ("Comente!", "Compartilhe!", "O que vocês acham?", "Vamos discutir?", "Me conta!", "E você?")
- Perguntas retóricas óbvias no final
- Hashtags genéricas (#Tech #AI #UX)
- Frases que parecem AI ("É hora de refletir sobre", "Vamos trocar experiências")
- Excesso de emojis ou pontuação (!!!)
- Começar com "Você já parou para pensar" ou similar
- NUNCA cortar o texto no meio — cada post deve ser completo e fazer sentido sozinho

OBRIGATÓRIO (isso gera engajamento real):
- Cada variação deve ter estrutura e ângulo COMPLETAMENTE diferentes entre si
- Escreva como uma pessoa real que tem opinião — não como um bot motivacional
- Termine com uma afirmação forte, um dado surpreendente, ou uma frase que provoca reflexão naturalmente
- Formatos para variar: dado + opinião, contrarian take, mini-história, lista de 3 itens, analogia inesperada, confissão profissional
- Se usar hashtag, máximo 1 e deve ser ultra-específica
${mentorSection}
${avoidSection}

Temas (baseados no que o usuário consome):
${topicsSummary}

Referências do timeline (NÃO copiar, só absorver o estilo):
${snippets.slice(0, 6000)}

Responda APENAS JSON array com ${count} strings. Cada string é um post completo${format === "thread" ? " (posts da thread separados por ---)." : "."}
["post 1", "post 2", ...]`;

  const messages: { role: "system" | "user"; content: string }[] = [];
  if (params.systemPrompt) {
    messages.push({ role: "system", content: params.systemPrompt });
  }
  messages.push({ role: "user", content: prompt });

  // max_tokens proporcional ao formato
  // 280 chars ≈ ~100 tokens, mas o JSON + aspas + overhead sobe
  // Margem generosa para evitar cortes
  const tokensPerPost = format === "thread" ? 2000 : format === "long" ? 1200 : 350;

  const res = await loggedCall("generateDrafts", prompt.slice(0, 200), () =>
    c.chat.completions.create({
      model: openaiModel,
      messages,
      temperature: 0.95,
      max_tokens: count * tokensPerPost + 100,
    })
  );

  const raw = res.choices[0]?.message?.content?.trim() ?? "";
  console.log("[drafts] resposta bruta LLM:", raw.slice(0, 300));

  // Tenta extrair JSON array — pode vir com markdown, backticks, etc
  const jsonStr = raw
    .replace(/^```(?:json)?\s*/i, "")  // remove ```json no início
    .replace(/\s*```$/, "")             // remove ``` no final
    .trim();

  /**
   * Se o formato é "short" e o texto ultrapassou maxChars,
   * corta de forma inteligente no último ponto final.
   * Para "long" e "thread", mantém o texto íntegro.
   */
  function fitToLimit(text: string): string {
    // Converte \n literais (que a LLM às vezes gera como texto) em quebras reais
    const t = text.replace(/\\n/g, "\n").trim();
    if (format !== "short" || t.length <= maxChars) return t;
    return smartTruncate(t, maxChars);
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, count).map((t: unknown) => fitToLimit(String(t)));
    }
    console.log("[drafts] resposta não é array, tentando extrair...");
  } catch (err) {
    console.log("[drafts] JSON parse falhou:", err instanceof Error ? err.message : err);
  }

  // Fallback: tenta encontrar array JSON dentro do texto
  const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const arr = JSON.parse(arrayMatch[0]) as string[];
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.slice(0, count).map(t => fitToLimit(String(t)));
      }
    } catch {
      console.log("[drafts] fallback array parse também falhou");
    }
  }

  // Último recurso: divide por padrões comuns de separação
  const lines = jsonStr
    .replace(/^\[?\s*"?|"?\s*\]?$/g, "") // remove [ ] " nas pontas
    .split(/",\s*"/)                       // divide por ", "
    .map(s => s.replace(/^"|"$/g, "").trim())
    .filter(s => s.length > 20);

  if (lines.length > 0) {
    console.log("[drafts] extraído", lines.length, "posts por split manual");
    return lines.slice(0, count).map(t => fitToLimit(t));
  }

  console.log("[drafts] nenhum parse funcionou, retornando texto limpo");
  // Limpa o texto bruto removendo artefatos JSON
  const cleaned = raw
    .replace(/^\[?\s*"?/, "")
    .replace(/"?\s*\]?$/, "")
    .replace(/\\n/g, "\n")
    .trim();
  return [fitToLimit(cleaned)];
}

/**
 * Gera uma thread com prompts encadeados.
 * Cada post é gerado com contexto dos anteriores para coerência narrativa.
 */
export async function generateThreadWithLlm(params: {
  topicsSummary: string;
  exampleSnippets: string[];
  tone: string;
  threadLength?: number;
  systemPrompt?: string;
}): Promise<string[]> {
  const c = getClient();
  if (!c) return [`Thread sobre: ${params.topicsSummary.slice(0, 200)}`];

  const threadLength = params.threadLength ?? 4;
  const posts: string[] = [];

  for (let i = 0; i < threadLength; i++) {
    const isFirst = i === 0;
    const isLast = i === threadLength - 1;

    let contextSection = "";
    if (posts.length > 0) {
      contextSection = `\nPosts anteriores da thread (mantenha coerência narrativa):\n${posts.map((p, idx) => `[${idx + 1}/${threadLength}] ${p}`).join("\n\n")}`;
    }

    const roleMap: Record<string, string> = {
      first: `PRIMEIRO post da thread — gancho irresistível. 1-2 frases que fazem parar de scrollar. Curto, provocativo, sem explicação. Crie curiosidade para o próximo post.`,
      middle: `Post ${i + 1} de ${threadLength} — DESENVOLVA com dados concretos, exemplos reais, ou analogias. Cada post deve adicionar uma camada nova ao argumento, não repetir o anterior.`,
      last: `ÚLTIMO post — conclusão forte. O insight principal. Uma frase que gruda na cabeça. SEM call to action genérica (nada de "Fique ligado", "Comente", "E você?").`,
    };
    const role = isFirst ? "first" : isLast ? "last" : "middle";

    const prompt = `Escreva o post ${i + 1} de ${threadLength} de uma thread para o X, em português brasileiro.
Tom: ${params.tone}
MÁXIMO 250 caracteres (deixe margem — NUNCA ultrapasse 280). O post DEVE ser completo — nunca cortado no meio de uma frase.

${roleMap[role]}

PROIBIDO:
- "Fique ligado", "Vamos explorar/desvendar", "Comente aqui", "E você?", "Compartilhe"
- Ponto-e-vírgula (;) — ninguém usa no X. Use ponto final ou vírgula.
- Reticências (...) no final — parece cortado
- "Você já parou para pensar" — clichê de AI
- Frases longas com múltiplas orações subordinadas — quebre em frases curtas

Escreva como uma pessoa real que posta no X — direto, curto, opinionado.
${contextSection}

Temas: ${params.topicsSummary.slice(0, 500)}

Responda APENAS o texto do post, sem aspas, sem numeração, sem prefixo.`;

    const messages: { role: "system" | "user"; content: string }[] = [];
    if (params.systemPrompt) messages.push({ role: "system", content: params.systemPrompt });
    messages.push({ role: "user", content: prompt });

    try {
      const res = await loggedCall(`generateThread_${i + 1}/${threadLength}`, prompt.slice(0, 100), () =>
        c.chat.completions.create({
          model: openaiModel,
          messages,
          temperature: 0.85,
          max_tokens: 200,
        })
      );
      const text = res.choices[0]?.message?.content?.trim() ?? "";
      posts.push(smartTruncate(text, 280));
    } catch {
      posts.push(`[Post ${i + 1}/${threadLength} - erro na geração]`);
    }
  }

  return posts;
}

export async function generateDraftWithLlm(params: {
  topicsSummary: string;
  exampleSnippets: string[];
  tone: string;
}): Promise<string> {
  const results = await generateDraftsWithLlm({
    ...params,
    count: 1,
    format: "short",
    maxChars: 280,
    mentors: [],
    existingDrafts: [],
  });
  return results[0] ?? "";
}
