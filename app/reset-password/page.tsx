"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase сам обрабатывает токен восстановления из URL и создаёт временную
    // сессию - просто дожидаемся, пока она подтянется, прежде чем показать форму
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен быть не короче 6 символов");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  return (
    <main className="min-h-screen bg-body px-4 pb-10 pt-20">
      <div className="mx-auto w-full max-w-[440px]">
        <Heading level={1} className="mb-10 text-xl font-medium">
          Новый пароль
        </Heading>

        {done ? (
          <Banner
            status="success"
            title="Пароль обновлён"
            description="Переносим в кабинет…"
          />
        ) : !ready ? (
          <Text color="secondary">Проверяем ссылку…</Text>
        ) : (
          <form onSubmit={handleSubmit}>
            <Stack gap={5}>
              <TextInput
                label="Новый пароль"
                type="password"
                size="lg"
                value={password}
                onChange={(value) => setPassword(value)}
              />
              <TextInput
                label="Повторите пароль"
                type="password"
                size="lg"
                value={confirmPassword}
                onChange={(value) => setConfirmPassword(value)}
              />

              {error && <Text className="text-error">{error}</Text>}

              <Button
                type="submit"
                variant="primary"
                width="100%"
                isLoading={loading}
                label={loading ? "Секунду…" : "Сохранить пароль"}
              />
            </Stack>
          </form>
        )}
      </div>
    </main>
  );
}
