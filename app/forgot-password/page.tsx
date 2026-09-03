"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Button } from "@astryxdesign/core/Button";
import { Link } from "@astryxdesign/core/Link";
import { Banner } from "@astryxdesign/core/Banner";
import { createClient } from "@/lib/supabase";
import { sanitizeNextPath } from "@/shared/lib/next-url";

function ForgotPasswordForm() {
  const supabase = createClient();
  const searchParams = useSearchParams();

  // Симметрично /login <-> /signup: если сюда пришли уже с ?next (по
  // ссылке "Забыли пароль?" на /login), не теряем его на обратном пути.
  const next = sanitizeNextPath(searchParams.get("next"));
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setResetSent(true);
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
            Восстановление пароля
          </Heading>
        </Stack>

        {resetSent ? (
          <Banner
            status="success"
            title="Проверьте почту"
            description="Если аккаунт с таким email существует, мы отправили на него ссылку для сброса пароля."
          />
        ) : (
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

              {error && <Text className="text-error">{error}</Text>}

              <Button
                type="submit"
                variant="primary"
                width="100%"
                isLoading={loading}
                label={loading ? "Секунду…" : "Отправить ссылку для сброса"}
              />
            </Stack>
          </form>
        )}

        <Text justify="center" color="secondary" className="mt-6">
          <Link href={loginHref}>Вернуться ко входу</Link>
        </Text>
      </div>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
