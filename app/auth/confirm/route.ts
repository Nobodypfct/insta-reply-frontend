import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";
import { sanitizeNextPath } from "@/shared/lib/next-url";

// сюда ведут ссылки из писем Supabase (подтверждение регистрации,
// восстановление пароля). Используем token_hash + verifyOtp вместо
// PKCE code exchange - это работает независимо от того, в каком браузере
// или устройстве юзер открыл письмо (PKCE привязан к куки конкретного
// браузера, где начиналась регистрация - ссылка могла бы не сработать,
// если открыть письмо на телефоне после регистрации на компьютере)
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = sanitizeNextPath(searchParams.get("next")) ?? "/dashboard";

  if (tokenHash && type) {
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

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      const isPasswordReset = next.includes("reset-password");
      const separator = next.includes("?") ? "&" : "?";
      const finalUrl = isPasswordReset ? next : `${next}${separator}verified=1`;
      return NextResponse.redirect(`${origin}${finalUrl}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?verify_error=1`);
}
