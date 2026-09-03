"use client";

import { useState } from "react";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Button } from "@astryxdesign/core/Button";
import { Link } from "@astryxdesign/core/Link";
import { Divider } from "@astryxdesign/core/Divider";
import { Banner } from "@astryxdesign/core/Banner";
import { createClient } from "@/lib/supabase";

export default function SignupPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }

    // Supabase не даёт прямой ошибки "уже зарегистрирован" (по соображениям
    // безопасности), но если identities пустой - значит юзер с таким email
    // уже существует и подтверждён
    if (data.user && data.user.identities?.length === 0) {
      setError(
        "Этот email уже зарегистрирован. Попробуйте войти или восстановить пароль.",
      );
      return;
    }

    setSignupDone(true);
  }

  async function handleOAuth(provider: "google" | "facebook") {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  return (
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
            Создать аккаунт
          </Heading>
        </Stack>

        {signupDone ? (
          <Banner
            status="success"
            title="Проверьте почту"
            description={`Мы отправили ссылку для подтверждения аккаунта на ${email}.`}
          />
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
                <TextInput
                  label="Пароль"
                  type="password"
                  size="lg"
                  value={password}
                  onChange={(value) => setPassword(value)}
                  placeholder="не меньше 6 символов"
                />

                {error && <Text className="text-error">{error}</Text>}

                <Button
                  type="submit"
                  variant="primary"
                  width="100%"
                  isLoading={loading}
                  label={loading ? "Секунду…" : "Создать аккаунт"}
                />
              </Stack>
            </form>

            <Divider
              label={<span className="tracking-wide">ИЛИ ЗАРЕГИСТРИРУЙТЕСЬ ЧЕРЕЗ</span>}
            />

            <Stack gap={2}>
              <Button
                variant="secondary"
                width="100%"
                label="Продолжить с Google"
                onClick={() => handleOAuth("google")}
                className="border border-border-strong bg-surface hover:bg-body"
              />
              <Button
                variant="secondary"
                width="100%"
                label="Продолжить с Facebook"
                onClick={() => handleOAuth("facebook")}
                className="border border-border-strong bg-surface hover:bg-body"
              />
            </Stack>
          </Stack>
        )}

        {!signupDone && (
          <Text justify="center" color="secondary" className="mt-6">
            Уже есть аккаунт? <Link href="/login">Войти</Link>
          </Text>
        )}
      </div>
    </main>
  );
}
