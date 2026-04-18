import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { config } from "dotenv";

config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "supabase-migrations");

async function tryConnect(connectionString: string): Promise<pg.Client | null> {
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    return client;
  } catch {
    try { await client.end(); } catch {}
    return null;
  }
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;

  if (!supabaseUrl || !dbPassword) {
    console.error("Defina SUPABASE_URL e SUPABASE_DB_PASSWORD no .env");
    process.exit(1);
  }

  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];

  const connectionStrings = [
    `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`,
    `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
  ];

  let client: pg.Client | null = null;

  for (const cs of connectionStrings) {
    const host = cs.split("@")[1]?.split(":")[0] ?? "unknown";
    process.stdout.write(`Tentando ${host}... `);
    client = await tryConnect(cs);
    if (client) {
      console.log("OK!");
      break;
    }
    console.log("falhou.");
  }

  if (!client) {
    console.error("\nNenhuma conexão funcionou. Verifique a senha e a região do Supabase.");
    console.error("Você também pode copiar o conteúdo de src/db/supabase-migrations/005_users.sql");
    console.error("e colar no Supabase Dashboard → SQL Editor.");
    process.exit(1);
  }

  try {
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      console.log("Nenhuma migration em", MIGRATIONS_DIR);
      return;
    }

    const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith(".sql")).sort();

    for (const file of files) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
      console.log(`\nAplicando ${file}...`);

      // Remove comentários SQL antes de processar
      const cleanedSql = sql.replace(/--[^\n]*/g, "");
      const statements = cleanedSql
        .split(";")
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const stmt of statements) {
        try {
          await client.query(stmt + ";");
          console.log(`  ✓ ${stmt.slice(0, 60).replace(/\n/g, " ")}...`);
        } catch (err: any) {
          if (
            err.message?.includes("already exists") ||
            err.message?.includes("duplicate")
          ) {
            console.log(`  ⚠ ${err.message.slice(0, 80)}`);
          } else {
            console.error(`  ❌ ${err.message}`);
            console.error(`     SQL: ${stmt.slice(0, 100).replace(/\n/g, " ")}`);
          }
        }
      }
      console.log(`  ✅ ${file} done.`);
    }

    console.log("\nMigrations concluídas.");
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error("Erro:", e.message);
  process.exit(1);
});
