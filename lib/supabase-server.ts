import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase-клиент для серверных компонентов (layout'ы защищённых разделов —
 * см. app/dashboard/layout.tsx, app/instagram-connected/layout.tsx).
 * `setAll` обёрнут в try/catch: Server Component физически не может писать
 * cookies (упадёт с ошибкой, если вызвать) — это не проблема, потому что
 * рефрешем токена уже занимается proxy.ts на каждый запрос до того,
 * как рендер сюда доходит.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component — молча игнорируем, см. комментарий выше
          }
        },
      },
    },
  );
}
