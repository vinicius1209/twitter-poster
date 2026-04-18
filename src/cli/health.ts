import { checkSessionHealth } from "../browser/healthcheck.js";

const POLL_INTERVAL = 3_000;

async function waitForLogin(): Promise<void> {
  const h = await checkSessionHealth(true);
  console.log(JSON.stringify(h, null, 2));

  if (h.loggedIn) {
    process.exit(0);
  }

  console.log(
    "\nNavegador aberto. Faça login no X manualmente. Aguardando...",
  );

  await new Promise<void>((resolve) => {
    const iv = setInterval(async () => {
      try {
        const check = await checkSessionHealth(false);
        if (check.loggedIn) {
          console.log("\nLogin detectado!");
          clearInterval(iv);
          resolve();
        } else {
          process.stdout.write(".");
        }
      } catch {
        process.stdout.write(".");
      }
    }, POLL_INTERVAL);
  });

  process.exit(0);
}

void waitForLogin().catch((e) => {
  console.error(e);
  process.exit(1);
});
