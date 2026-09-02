import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// сюда Supabase редиректит после того как юзер подтвердит email
// (или сбросит пароль) - обмениваем одноразовый код на реальную сессию
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

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
      // если пришли не по ссылке восстановления пароля - это подтверждение
      // регистрации, добавим флаг для уведомления на дашборде
      const isPasswordReset = next.includes("reset-password");
      const separator = next.includes("?") ? "&" : "?";
      const finalUrl = isPasswordReset ? next : `${next}${separator}verified=1`;
      return NextResponse.redirect(`${origin}${finalUrl}`);
    }
  }

  // что-то пошло не так - отправляем обратно на логин с пометкой об ошибке
  return NextResponse.redirect(`${origin}/login?verify_error=1`);
}
