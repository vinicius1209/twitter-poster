#!/usr/bin/env node
/**
 * Twitter Poster Agent — CLI standalone.
 *
 * Conecta ao Core API, pega tasks de browser, executa via Playwright.
 *
 * Uso:
 *   npx tsx packages/agent/src/cli.ts --core-url http://localhost:3847 --token xxx
 *   npx tsx packages/agent/src/cli.ts --core-url https://your-app.railway.app --token xxx
 */

import { config } from "dotenv";
config();

import { CoreClient } from "./client.js";
import { startPollingLoop } from "./loop.js";

// Parse args
const args = process.argv.slice(2);
function getArg(name: string, defaultValue?: string): string {
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  // Fallback to env
  const envName = name.replace(/-/g, "_").toUpperCase();
  return process.env[envName] ?? process.env[`AGENT_${envName}`] ?? defaultValue ?? "";
}

const coreUrl = getArg("core-url", "http://localhost:3847");
const token = getArg("token", process.env.AGENT_TOKEN ?? "");
const pollInterval = parseInt(getArg("poll-interval", "5000"), 10);

if (!coreUrl) {
  console.error("Uso: npx tsx packages/agent/src/cli.ts --core-url <url> --token <token>");
  process.exit(1);
}

console.log("╔══════════════════════════════════════╗");
console.log("║     Twitter Poster Agent v1.0        ║");
console.log("╚══════════════════════════════════════╝");
console.log(`Core: ${coreUrl}`);
console.log(`Token: ${token ? "***" + token.slice(-4) : "(sem token)"}`);
console.log(`Intervalo: ${pollInterval}ms`);
console.log("");

const client = new CoreClient(coreUrl, token);
const controller = new AbortController();

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n[agent] Encerrando...");
  controller.abort();
});
process.on("SIGTERM", () => {
  controller.abort();
});

// Start
startPollingLoop(client, pollInterval, controller.signal)
  .then(() => {
    console.log("[agent] Encerrado.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("[agent] Erro fatal:", err);
    process.exit(1);
  });
