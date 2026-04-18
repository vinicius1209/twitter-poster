const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;

/**
 * Valida que a string é um handle válido do X (sem @).
 */
export function isValidHandle(handle: string): boolean {
  return HANDLE_RE.test(handle);
}

/**
 * Remove @ opcional e valida. Retorna o handle limpo ou null se inválido.
 */
export function sanitizeHandle(raw: string): string | null {
  const h = raw.replace(/^@/, "");
  return isValidHandle(h) ? h : null;
}
