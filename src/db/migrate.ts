import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

/**
 * Sistema de migrations versionado.
 * Lê arquivos SQL de src/db/migrations/ e aplica os que ainda não rodaram.
 * Compatível com PostgreSQL (usa CURRENT_TIMESTAMP, sem sintaxe SQLite-only).
 */
export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const applied = new Set(
    (db.prepare("SELECT version FROM schema_version").all() as { version: number }[])
      .map(r => r.version),
  );

  if (!fs.existsSync(MIGRATIONS_DIR)) return;

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const match = file.match(/^(\d+)/);
    if (!match) continue;

    const version = parseInt(match[1], 10);
    if (applied.has(version)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
    console.log(`[migrate] aplicando ${file}...`);

    const tx = db.transaction(() => {
      // Executa cada statement separadamente para lidar com ALTER TABLE
      const statements = sql
        .split(";")
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const stmt of statements) {
        try {
          db.exec(stmt);
        } catch (err) {
          // Ignora "duplicate column name" para ALTER TABLE idempotente
          const msg = err instanceof Error ? err.message : "";
          if (msg.includes("duplicate column name")) {
            console.log(`[migrate] coluna já existe, ignorando: ${msg}`);
          } else {
            throw err;
          }
        }
      }

      db.prepare(
        "INSERT INTO schema_version (version, name, applied_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
      ).run(version, file);
    });

    tx();
    console.log(`[migrate] ${file} aplicada.`);
  }
}
