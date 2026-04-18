import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import { checkSessionHealth } from "../browser/healthcheck.js";
import { getBrowserProfilePath } from "../browser/session.js";
import fs from "node:fs";
import path from "node:path";
import { browserUserDataDir } from "../config.js";

const router = Router();

router.get("/config", (_req, res) => {
  res.json({ browserProfilePath: getBrowserProfilePath() });
});

/**
 * Verificação rápida — NÃO abre o browser.
 * Checa se o perfil e cookies existem no disco.
 */
router.get("/session/quick", (_req, res) => {
  const cookiesPath = path.join(browserUserDataDir, "Default", "Cookies");
  const profileExists = fs.existsSync(cookiesPath);
  res.json({
    ok: true,
    profileExists,
    hint: profileExists
      ? "Perfil encontrado. Clique 'Verificar sessão' para testar o login no X."
      : "Perfil não encontrado. Rode 'npm run health' para criar e fazer login.",
  });
});

/**
 * Verificação completa — abre o browser, navega ao X, checa login.
 * Pode demorar 10-30s.
 */
router.get(
  "/session",
  asyncHandler(async (_req, res) => {
    const h = await checkSessionHealth();
    res.json(h);
  }),
);

export default router;
