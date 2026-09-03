import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sanitizeNextPath } from "@/shared/lib/next-url";

/**
 * Сюда Supabase редиректит после OAuth-логина/регистрации (Google,
 * Facebook) — обмениваем одноразовый PKCE `code` на реальную сессию.
 * Именно этим (не /auth/confirm — тот для email-ссылок через token_hash,
 * см. CLAUDE.md) должен быть `redirectTo` у `signInWithOAuth()` в
 * app/login/page.tsx и app/signup/page.tsx.
 *
 * ВАЖНО: обмен должен произойти именно тут, на сервере, а не полагаться
 * на клиентский Supabase-клиент, который сам подхватит `?code=` из URL —
 * до фикса именно так и было (`redirectTo` вёл прямо на `/dashboard`), и
 * это работало только потому, что раньше ничего не перехватывало запрос
 * раньше браузера. После появления proxy.ts (серверный гейт /dashboard)
 * это сломалось: proxy.ts видит `/dashboard?code=...` БЕЗ сессии (cookie
 * ещё не установлена — обмен ещё не произошёл) и отправляет на /login,
 * теряя один одноразовый code раньше, чем клиентский JS успевает его
 * обменять. /auth/callback исключён из matcher'а proxy.ts как раз для
 * того, чтобы обмен успевал произойти здесь и УЖЕ с валидной cookie
 * долетать до /dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNextPath(searchParams.get("next")) ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // что-то пошло не так - отправляем обратно на логин с пометкой об ошибке
  return NextResponse.redirect(`${origin}/login?verify_error=1`);
}
