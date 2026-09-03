"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { getAccounts } from "@/entities/ig-account/api";
import type { IgAccount } from "@/entities/ig-account/types";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { ActiveStatusBadge } from "@/shared/components/ActiveStatusBadge";

function AccountsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<IgAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const connectedUsername = searchParams.get("connected");
  const connectError = searchParams.get("connect_error");
  const emailVerified = searchParams.get("verified") === "1";

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUserId(data.user.id);

      const json = await getAccounts(data.user.id);
      setAccounts(json.accounts || []);
      setLoading(false);
    }
    init();
  }, []);

  function handleConnect() {
    if (!userId) return;
    signIn("instagram", { callbackUrl: "/instagram-connected" });
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <Heading level={1} className="text-xl font-medium">
          Ваши Instagram-аккаунты
        </Heading>
        <Button
          variant="primary"
          label="+ Подключить Instagram"
          onClick={handleConnect}
        />
      </div>

      {(emailVerified || connectedUsername || connectError) && (
        <Stack gap={3} className="mb-6">
          {emailVerified && (
            <Banner status="success" title="Email подтверждён, добро пожаловать! 🎉" />
          )}
          {connectedUsername && (
            <Banner
              status="success"
              title={`Аккаунт @${connectedUsername} успешно подключён.`}
            />
          )}
          {connectError && (
            <Banner
              status="error"
              title={`Не получилось подключить аккаунт (${connectError})`}
              description="Попробуйте ещё раз."
            />
          )}
        </Stack>
      )}

      {loading ? (
        <Text color="secondary">Загрузка…</Text>
      ) : accounts.length === 0 ? (
        <EmptyState
          icon={<Users size={32} />}
          title="Пока нет подключённых аккаунтов"
          description="Подключите Instagram, чтобы включить автоответ на комментарии и DM."
          actions={
            <Button
              variant="primary"
              label="Подключить первый аккаунт"
              onClick={handleConnect}
            />
          }
        />
      ) : (
        <Stack gap={3}>
          {accounts.map((acc) => (
            <ClickableCard
              key={acc.id}
              href={`/dashboard/accounts/${acc.id}`}
              label={`Открыть шаблоны @${acc.username}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <Text weight="medium">@{acc.username}</Text>
                  <Text
                    color="secondary"
                    type="supporting"
                    className="mt-0.5 block"
                  >
                    Подключён{" "}
                    {new Date(acc.created_at).toLocaleDateString("ru-RU")}
                  </Text>
                </div>
                <ActiveStatusBadge isActive={acc.webhook_enabled} />
              </div>
            </ClickableCard>
          ))}
        </Stack>
      )}
    </div>
  );
}

export default function AccountsPage() {
  return (
    <Suspense fallback={null}>
      <AccountsContent />
    </Suspense>
  );
}
