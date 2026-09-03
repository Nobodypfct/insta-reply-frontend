/**
 * Санитайзер параметра `next` (куда вернуть юзера после логина/регистрации,
 * см. middleware.ts) — защита от open redirect. Принимаем ТОЛЬКО
 * относительный путь внутри приложения:
 * - должен начинаться с одного "/" (не "//host/..." — protocol-relative URL)
 * - не должен содержать "://" (абсолютный URL на другой хост)
 *
 * Чистая функция без Node-специфичных API — используется и в middleware
 * (Edge runtime), и в клиентских login/signup компонентах.
 */
export function sanitizeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return null;
  }
  return value;
}
