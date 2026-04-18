import { describe, it, expect } from "vitest";
import { extractTopTerms, summarizeHeuristic } from "../src/ai/heuristicTopics.js";

describe("extractTopTerms", () => {
  it("extracts frequent words, ignoring stop words and short words", () => {
    // min 4 chars, min 2 occurrences
    const corpus = "typescript typescript typescript react react javascript javascript";
    const terms = extractTopTerms(corpus, 3);
    expect(terms).toContain("typescript");
    expect(terms).toContain("react");
    expect(terms).toContain("javascript");
  });

  it("ignores words with fewer than 2 occurrences", () => {
    const corpus = "typescript typescript react unique";
    const terms = extractTopTerms(corpus, 5);
    expect(terms).toContain("typescript");
    expect(terms).not.toContain("unique");
  });

  it("ignores words shorter than 4 chars", () => {
    const corpus = "app app app big big big typescript typescript";
    const terms = extractTopTerms(corpus, 5);
    expect(terms).not.toContain("app");
    expect(terms).not.toContain("big");
    expect(terms).toContain("typescript");
  });

  it("strips URLs and @mentions before counting", () => {
    const corpus = "@user1 check https://example.com cool cool stuff stuff";
    const terms = extractTopTerms(corpus, 2);
    expect(terms).toEqual(["cool", "stuff"]);
  });

  it("handles empty input", () => {
    expect(extractTopTerms("", 5)).toEqual([]);
  });

  it("ignores Portuguese stop words", () => {
    const corpus = "para que isso funcione com uma boa solução solução solução";
    const terms = extractTopTerms(corpus, 2);
    expect(terms[0]).toBe("solução");
  });
});

describe("summarizeHeuristic", () => {
  it("returns summary with tweet count and topics", () => {
    const texts = ["react hooks são úteis úteis", "react context é poderoso poderoso", "react react react"];
    const result = summarizeHeuristic(texts, 24);
    expect(result.summary).toContain("24h");
    expect(result.summary).toContain("3 tweets");
    expect(result.topics.length).toBeGreaterThan(0);
    expect(result.topics).toContain("react");
  });

  it("handles empty texts", () => {
    const result = summarizeHeuristic([], 12);
    expect(result.summary).toContain("0 tweets");
    expect(result.topics).toEqual([]);
  });
});
