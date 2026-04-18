const STOP = new Set(
  `
  a o os as de do da dos das um uma uns umas em no na nos nas por para com sem se que
  não nao mais muito mais como isso essa esse está esta tudo tem são sao foi pode ser ter
  mas então entao quando sobre entre ainda pode já ja ela ele eles elas seu sua seus suas
  meu minha nosso nossa isso aqui ali bem vai vou fazer faz feito cada vez toda todo
  the a an and or of to in on for is are was were be been being it this that these those
  i you he she we they me him her us them my your his our their what which who when where
  how why just not but with has have had will can could would should may might also very
  been into from than more some other its only over such after before between each
  most about up out do did get got here there then now also back even still new way
  make made like get got go going been well really thing things way much many time
  rt via http https www com
  `.split(/\s+/).filter(Boolean),
);

export function extractTopTerms(corpus: string, topN = 12): string[] {
  const words = corpus
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/@\w+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w)); // min 4 chars (era 3)

  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }
  return [...freq.entries()]
    .filter(([, count]) => count >= 2) // precisa aparecer pelo menos 2x
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([w]) => w);
}

export function summarizeHeuristic(
  texts: string[],
  windowHours: number,
): { summary: string; topics: string[] } {
  const corpus = texts.join("\n");
  const topics = extractTopTerms(corpus, 15);
  const summary = topics.length > 0
    ? `Análise heurística (sem IA) de ${texts.length} tweets nas últimas ~${windowHours}h. Termos mais frequentes: ${topics.slice(0, 8).join(", ")}.`
    : `${texts.length} tweets coletados nas últimas ~${windowHours}h, mas poucos termos em comum. Colete mais dados para uma análise melhor.`;
  return { summary, topics };
}
