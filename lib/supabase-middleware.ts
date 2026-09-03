import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Читает/рефрешит Supabase-сессию из cookies запроса на уровне middleware
 * (Edge runtime) — официальный паттерн `@supabase/ssr` для Next.js. Кроме
 * определения "залогинен/нет", попутно молча обновляет access-token, если
 * он протух, но refresh-token ещё валиден (иначе юзера разлогинивало бы
 * при каждом истечении access-token, даже посреди активной сессии).
 *
 * `supabase.auth.getUser()` (не `getSession()`!) — единственный способ,
 * который в серверном контексте реально валидирует JWT, а не просто читает
 * то, что лежит в cookie.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
