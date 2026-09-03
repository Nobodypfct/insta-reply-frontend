import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase-middleware";
import { sanitizeNextPath } from "@/shared/lib/next-url";

/**
 * Гейт авторизации для Supabase-сессии кабинета — ДО рендера страницы, без
 * клиентского флэша формы/контента. Не путать с Auth.js-сессией
 * (подключение Instagram) — та живёт в /api/auth/[...nextauth], сюда не
 * попадает (см. matcher ниже и CLAUDE.md, "не смешивай Supabase Auth и
 * Auth.js").
 *
 * Файл называется `proxy.ts`, не `middleware.ts` — в Next.js 16 конвенция
 * `middleware` deprecated и переименована в `proxy` (тот же механизм,
 * просто новое имя файла/функции — см. node_modules/next/dist/docs/01-app/
 * 03-api-reference/03-file-conventions/proxy.md). Экспортируемая функция
 * тоже должна называться `proxy`, не `middleware`.
 */
const PROTECTED_PREFIXES = ["/dashboard", "/instagram-connected"];
const PUBLIC_AUTH_PATHS = ["/login", "/signup", "/forgot-password"];
// /reset-password сознательно НЕ входит ни в один из списков: юзер попадает
// туда по ссылке восстановления с уже легитимной (recovery) сессией — если
// добавить её в PUBLIC_AUTH_PATHS, залогиненного там же и забонсит на
// /dashboard, и сброс пароля станет невозможен.

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PATHS.includes(pathname);
}

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  if (isProtectedPath(pathname) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicAuthPath(pathname) && user) {
    const next = sanitizeNextPath(request.nextUrl.searchParams.get("next"));
    return NextResponse.redirect(new URL(next ?? "/dashboard", request.url));
  }

  // ВАЖНО: возвращаем именно supabaseResponse (не NextResponse.next() с
  // нуля) — в нём уже проставлены свежие cookies после возможного рефреша
  // токена внутри updateSession(). Если вернуть новый пустой response,
  // рефрешнутая сессия потеряется и юзера будет разлогинивать раньше срока.
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|auth/confirm|auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
