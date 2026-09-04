"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { sanitizeNextPath } from "@/shared/lib/next-url";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Button } from "@astryxdesign/core/Button";
import { Link } from "@astryxdesign/core/Link";
import { Divider } from "@astryxdesign/core/Divider";
import { Banner } from "@astryxdesign/core/Banner";

/**
 * Официальный многоцветный логотип "G" Google — используется по гайдлайнам
 * Google для кнопок "Войти через Google" (Google Identity branding).
 */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.6836-3.8745 2.6836-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.4673-.8064 5.9564-2.1818l-2.9087-2.2581c-.8064.54-1.8368.8591-3.0477.8591-2.3436 0-4.3282-1.5831-5.0359-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.9641 10.71c-.18-.54-.2827-1.1168-.2827-1.71s.1027-1.17.2827-1.71V4.9582H.9573C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9573 4.0418L3.9641 10.71z"
      />
      <path
        fill="#EA4335"
        d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.9641 7.29C4.6718 5.1627 6.6564 3.5795 9 3.5795z"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Санитайзится и здесь, и в middleware — middleware защищает свои
  // собственные редиректы, но на /login можно попасть и напрямую по
  // произвольной ссылке (?next=https://evil.com), минуя её, а next
  // отсюда идёт в разные места (router.push, OAuth redirectTo) — доверять
  // сырому значению из URL нельзя ни в одном из них.
  const next = sanitizeNextPath(searchParams.get("next"));
  // Проставляется shared/api/client.ts при принудительном разлогине
  // (протухший refresh-токен/повторный 401 после рефреша) — отличаем от
  // обычного захода на /login, чтобы не выглядело так, будто юзер просто
  // забыл, что не был залогинен.
  const sessionExpired = searchParams.get("session_expired") === "1";
  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : "/signup";
  const forgotPasswordHref = next
    ? `/forgot-password?next=${encodeURIComponent(next)}`
    : "/forgot-password";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      if (error.code === "email_not_confirmed") {
        setUnconfirmedEmail(email);
        setError(null);
        return;
      }
      setError(error.message);
      return;
    }
    router.push(next ?? "/dashboard");
  }

  async function handleResendConfirmation() {
    if (!unconfirmedEmail) return;
    setResendLoading(true);
    const confirmUrl = new URL("/auth/confirm", window.location.origin);
    if (next) confirmUrl.searchParams.set("next", next);
    await supabase.auth.resend({
      email: unconfirmedEmail,
      type: "signup",
      options: { emailRedirectTo: confirmUrl.toString() },
    });
    setResendLoading(false);
    setResendDone(true);
  }

  // Facebook OAuth логика сохранена (доступна тем же способом, что и раньше),
  // просто кнопка убрана из UI этой страницы по требованию редизайна —
  // не актуальна для нашей аудитории. Google по-прежнему использует эту же
  // функцию.
  async function handleOAuth(provider: "google" | "facebook") {
    // redirectTo ведёт на /auth/callback (обмен PKCE-кода на сессию на
    // сервере), а НЕ прямиком на next/"/dashboard" — см. комментарий в
    // app/auth/callback/route.ts, почему это критично после появления
    // proxy.ts.
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (next) callbackUrl.searchParams.set("next", next);
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl.toString() },
    });
  }

  return (
    // Горизонтально центрируем тем же паттерном, что и dashboard (max-width +
    // mx-auto), а не flex-центрированием контейнера — для консистентности.
    // По вертикали форма стоит в верхней трети (pt-20), а не строго по
    // центру viewport, как на референсе.
    <main className="min-h-screen bg-body px-4 pb-10 pt-20">
      <div className="mx-auto w-full max-w-[440px]">
        <Stack gap={1} className="mb-10">
          <Text
            type="label"
            color="secondary"
            className="text-[11px] tracking-wider"
          >
            INSTA-REPLY
          </Text>
          <Heading level={1} className="text-xl font-medium">
            Войти в кабинет
          </Heading>
        </Stack>

        {sessionExpired && !unconfirmedEmail && (
          <Banner
            status="warning"
            title="Сессия истекла"
            description="Войдите снова, чтобы продолжить."
            className="mb-6"
          />
        )}

        {unconfirmedEmail ? (
          <Stack gap={3}>
            <Text as="p">
              Email <Text weight="bold">{unconfirmedEmail}</Text> ещё не
              подтверждён. Проверьте почту (и папку «Спам») — там должна быть
              ссылка для подтверждения.
            </Text>
            {resendDone ? (
              <Text className="text-success">Письмо отправлено повторно ✓</Text>
            ) : (
              <Link
                onClick={handleResendConfirmation}
                isDisabled={resendLoading}
              >
                {resendLoading ? "Отправляем…" : "Отправить письмо ещё раз"}
              </Link>
            )}
            <Link
              onClick={() => {
                setUnconfirmedEmail(null);
                setResendDone(false);
              }}
              label="Назад"
            >
              ← Назад
            </Link>
          </Stack>
        ) : (
          <Stack gap={6}>
            <form onSubmit={handleSubmit}>
              <Stack gap={5}>
                <TextInput
                  label="Email"
                  type="email"
                  size="lg"
                  value={email}
                  onChange={(value) => setEmail(value)}
                  placeholder="you@example.com"
                />

                <Stack gap={2}>
                  <TextInput
                    label="Пароль"
                    type="password"
                    size="lg"
                    value={password}
                    onChange={(value) => setPassword(value)}
                    placeholder="не меньше 6 символов"
                  />
                  <Link href={forgotPasswordHref}>Забыли пароль?</Link>
                </Stack>

                {error && <Text className="text-error">{error}</Text>}

                <Button
                  type="submit"
                  variant="primary"
                  width="100%"
                  isLoading={loading}
                  label={loading ? "Секунду…" : "Войти"}
                />
              </Stack>
            </form>

            <Divider
              label={<span className="tracking-wide">ИЛИ ВОЙДИТЕ ЧЕРЕЗ</span>}
            />

            {/*
              variant="secondary" красит заливкой (theme-neutral не даёт
              outline-варианта из коробки) — переопределяем именно фон и
              рамку через уже готовые Tailwind-токены темы (см.
              tailwind-theme.css), не хардкодя hex. border-border-strong —
              тот же токен (--color-border-emphasized), что использует
              рамка TextInput, для полной визуальной консистентности.
            */}
            <Button
              variant="secondary"
              width="100%"
              icon={<GoogleIcon />}
              label="Продолжить с Google"
              onClick={() => handleOAuth("google")}
              className="border border-border-strong bg-surface hover:bg-body"
            />
          </Stack>
        )}

        {!unconfirmedEmail && (
          <Text justify="center" color="secondary" className="mt-6">
            Ещё нет аккаунта? <Link href={signupHref}>Создать</Link>
          </Text>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
