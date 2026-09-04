"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { completeInstagramConnect } from "@/entities/ig-account/api";
import { ApiError } from "@/shared/api/client";
import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";

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
    // Личность юзера бэкенд теперь берёт из Bearer-токена (добавляется
    // в shared/api/client.ts), не из тела запроса — user_id тут больше
    // не нужен и не отправляется. Гейт живёт в
    // app/instagram-connected/layout.tsx (+ proxy.ts), сюда без сессии
    // не попасть.
    try {
      const json = await completeInstagramConnect({
        long_lived_token: s.igAccessToken,
        // Единственный момент, когда у нас вообще есть этот URL (см.
        // комментарий в auth.ts) — бэкенду нужно сохранить его сейчас,
        // самим сходить за ним позже уже не выйдет без нового OAuth.
        profile_picture_url: s.igProfilePictureUrl ?? null,
        force_transfer: forceTransfer,
      });
      router.push(`/dashboard/accounts?connected=${json.username}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        const body = e.body as { username: string; existingOwnerEmail: string };
        setConflict({
          username: body.username,
          existingOwnerEmail: body.existingOwnerEmail,
        });
        return;
      }
      router.push("/dashboard/accounts?connect_error=backend_failed");
    }
  }

  useEffect(() => {
    if (status === "loading") return;

    const s = session as any;
    if (!s?.igAccessToken) {
      setMessage("Не удалось получить данные Instagram. Попробуйте снова.");
      setTimeout(
        () => router.push("/dashboard/accounts?connect_error=no_session"),
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
              onClick={() => router.push("/dashboard/accounts")}
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
