"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createClient } from "@/lib/supabase";
import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function InstagramConnectedPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [message, setMessage] = useState("Завершаем подключение…");
  const [conflict, setConflict] = useState<{
    username: string;
    existingOwnerEmail: string;
  } | null>(null);
  const [transferring, setTransferring] = useState(false);

  async function completeConnect(forceTransfer: boolean) {
    const s = session as any;
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/login");
      return;
    }

    const res = await fetch(`${API_URL}/api/complete-instagram-connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: data.user.id,
        long_lived_token: s.igAccessToken,
        force_transfer: forceTransfer,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      router.push(`/dashboard?connected=${json.username}`);
      return;
    }

    if (res.status === 409) {
      const json = await res.json();
      setConflict({
        username: json.username,
        existingOwnerEmail: json.existingOwnerEmail,
      });
      return;
    }

    router.push("/dashboard?connect_error=backend_failed");
  }

  useEffect(() => {
    if (status === "loading") return;

    const s = session as any;
    if (!s?.igAccessToken) {
      setMessage("Не удалось получить данные Instagram. Попробуйте снова.");
      setTimeout(
        () => router.push("/dashboard?connect_error=no_session"),
        1500,
      );
      return;
    }

    completeConnect(false);
  }, [status]);

  async function handleConfirmTransfer() {
    setTransferring(true);
    await completeConnect(true);
  }

  if (conflict) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-body px-4">
        <Card padding={6} width="100%" maxWidth={440}>
          <Heading level={1} className="mb-3 text-base font-semibold">
            Аккаунт уже подключён
          </Heading>
          <Text color="secondary" className="mb-6 block">
            Аккаунт <Text weight="bold">@{conflict.username}</Text> привязан к
            проекту пользователя{" "}
            <Text weight="bold">{conflict.existingOwnerEmail}</Text>. При
            переносе аккаунт и все его автоматизации будут удалены из старого
            проекта и подключены к текущему.
          </Text>
          <Stack direction="horizontal" gap={3}>
            <Button
              variant="secondary"
              width="100%"
              label="Отмена"
              onClick={() => router.push("/dashboard")}
            />
            <Button
              variant="primary"
              width="100%"
              isLoading={transferring}
              label={transferring ? "Переносим…" : "Перенести аккаунт"}
              onClick={handleConfirmTransfer}
            />
          </Stack>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-body">
      <Text color="secondary">{message}</Text>
    </main>
  );
}
