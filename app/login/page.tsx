"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Button } from "@astryxdesign/core/Button";
import { Link } from "@astryxdesign/core/Link";
import { Divider } from "@astryxdesign/core/Divider";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

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
    router.push("/dashboard");
  }

  async function handleResendConfirmation() {
    if (!unconfirmedEmail) return;
    setResendLoading(true);
    await supabase.auth.resend({
      email: unconfirmedEmail,
      type: "signup",
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });
    setResendLoading(false);
    setResendDone(true);
  }

  async function handleOAuth(provider: "google" | "facebook") {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  return (
    <main className="bg-body flex min-h-screen items-center justify-center px-4">
      <Stack width={384} gap={6}>
        <Stack gap={1} align="center">
          <Text type="label" color="secondary">
            INSTA-REPLY
          </Text>
          <Heading level={1}>Войти в кабинет</Heading>
        </Stack>

        <Card padding={5}>
          {unconfirmedEmail ? (
            <Stack gap={3}>
              <Text as="p">
                Email <Text weight="bold">{unconfirmedEmail}</Text> ещё не
                подтверждён. Проверьте почту (и папку «Спам») — там должна
                быть ссылка для подтверждения.
              </Text>
              {resendDone ? (
                <Text className="text-success">
                  Письмо отправлено повторно ✓
                </Text>
              ) : (
                <Link onClick={handleResendConfirmation} isDisabled={resendLoading}>
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
            <Stack gap={5}>
              <form onSubmit={handleSubmit}>
                <Stack gap={4}>
                  <TextInput
                    label="Email"
                    type="email"
                    isRequired
                    value={email}
                    onChange={(value) => setEmail(value)}
                    placeholder="you@example.com"
                  />

                  <Stack gap={1.5}>
                    <TextInput
                      label="Пароль"
                      type="password"
                      isRequired
                      value={password}
                      onChange={(value) => setPassword(value)}
                      placeholder="не меньше 6 символов"
                    />
                    <Link href="/forgot-password">Забыли пароль?</Link>
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

              <Divider label="или" />

              <Stack gap={2}>
                <Button
                  variant="secondary"
                  width="100%"
                  label="Продолжить с Google"
                  onClick={() => handleOAuth("google")}
                />
                <Button
                  variant="secondary"
                  width="100%"
                  label="Продолжить с Facebook"
                  onClick={() => handleOAuth("facebook")}
                />
              </Stack>
            </Stack>
          )}
        </Card>

        {!unconfirmedEmail && (
          <Text justify="center" color="secondary">
            Ещё нет аккаунта? <Link href="/signup">Создать</Link>
          </Text>
        )}
      </Stack>
    </main>
  );
}
