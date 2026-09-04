import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Реальные внешние origin'ы, которые приложение действительно вызывает
// с браузера (fetch/XHR) — НЕ включает Instagram/Google/Facebook OAuth:
// те открываются полной навигацией (window.location/редирект), а не
// fetch()'ем, connect-src такие переходы не ограничивает.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
const connectSrc = ["'self'", supabaseUrl, apiUrl].filter(Boolean).join(" ");

/**
 * Без nonce (см. node_modules/next/dist/docs/01-app/02-guides/
 * content-security-policy.md, раздел "Without Nonces") — намеренно, не
 * недосмотр: nonce-based CSP требует ДИНАМИЧЕСКОГО рендеринга ВСЕХ
 * страниц (отключает статическую генерацию совсем) — у нас сейчас
 * /login, /signup, /forgot-password, /reset-password статические, и
 * менять стратегию рендеринга всего приложения ради CSP — отдельное,
 * куда более крупное решение, не входит в эту точечную задачу.
 *
 * `'unsafe-inline'` на script/style-src — плата за это (см. тот же файл
 * доков, "Common CSP Violations"): Next.js сам вставляет инлайн-скрипты
 * при гидратации/стриминге, а в PhonePreview.tsx используется React
 * `style={{...}}` (кастомные CSS-переменные мокапа) — оба паттерна не
 * работают под строгим CSP без nonce. CSP всё равно блокирует главный
 * класс XSS-пейлоадов (загрузку ВНЕШНЕГО вредоносного скрипта с чужого
 * домена), просто не защищает от инлайн-инъекций — то же самое
 * компромиссное решение, что показано как рекомендуемое "простое" в
 * официальных доках Next.js.
 */
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  font-src 'self';
  connect-src ${connectSrc};
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          // frame-ancestors в CSP выше уже покрывает это для современных
          // браузеров — X-Frame-Options оставлен как fallback для
          // старых, дублирование безвредно.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
