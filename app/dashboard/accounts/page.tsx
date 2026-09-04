"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Users, MoreVertical, RefreshCw } from "lucide-react";
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
import { Card } from "@astryxdesign/core/Card";
import { Avatar } from "@astryxdesign/core/Avatar";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { ActiveStatusBadge } from "@/shared/components/ActiveStatusBadge";

/** Число скелетон-карточек на время начальной загрузки — реальное
 * количество аккаунтов неизвестно заранее, тот же фиксированный-счётчик
 * приём, что уже применялся к TemplateCardSkeleton (см. app/dashboard/
 * accounts/[id]/TemplateCard.tsx). */
const ACCOUNT_SKELETON_COUNT = 3;

/** Форма повторяет реальную карточку аккаунта (аватар-кружок + 2 строки
 * текста + место под бейдж-статус + иконку меню) — по гайду Astryx
 * ("match the size and shape of the content being loaded"). `index` —
 * для волновой анимации между карточками. `ClickableCard` не годится под
 * скелетон (он кликабельный/навигирует) — обычный нейтральный `Card` той
 * же формы. */
function AccountCardSkeleton({ index }: { index: number }) {
  return (
    <Card padding={4}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton width={40} height={40} radius="rounded" index={index} />
          <div className="flex flex-col gap-2">
            <Skeleton width={140} height={14} index={index} />
            <Skeleton width={110} height={12} index={index} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton width={64} height={20} radius="rounded" index={index} />
          <Skeleton width={28} height={28} radius="rounded" index={index} />
        </div>
      </div>
    </Card>
  );
}

function AccountsContent() {
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
      // Гейт живёт в app/dashboard/layout.tsx (+ proxy.ts) — сюда без
      // сессии не попасть; проверка ниже чисто для сужения типа.
      if (!data.user) return;
      setUserId(data.user.id);

      const json = await getAccounts();
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
        <Stack gap={3}>
          {Array.from({ length: ACCOUNT_SKELETON_COUNT }).map((_, i) => (
            <AccountCardSkeleton key={i} index={i} />
          ))}
        </Stack>
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
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {/*
                    src=undefined (не пока не отдаёт бэкенд avatar_url) —
                    Avatar сам корректно откатывается на инициалы из name,
                    это его штатное поведение, отдельный фолбэк не нужен.
                  */}
                  <Avatar
                    src={acc.avatar_url ?? undefined}
                    name={acc.username}
                    size="md"
                  />
                  <div className="min-w-0">
                    <Text weight="medium" className="truncate">
                      @{acc.username}
                    </Text>
                    <Text
                      color="secondary"
                      type="supporting"
                      className="mt-0.5 block"
                    >
                      Подключён{" "}
                      {new Date(acc.created_at).toLocaleDateString("ru-RU")}
                    </Text>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <ActiveStatusBadge isActive={acc.webhook_enabled} />
                  {/*
                    "Nested interactive elements work independently" —
                    штатное поведение Astryx ClickableCard (см. его доки),
                    отдельный stopPropagation не нужен: клик по меню не
                    триггерит переход по href карточки.
                  */}
                  <DropdownMenu
                    button={{
                      icon: <MoreVertical size={16} />,
                      variant: "ghost",
                      isIconOnly: true,
                      label: `Действия с @${acc.username}`,
                    }}
                    hasChevron={false}
                    items={[
                      {
                        label: "Переподключить Instagram",
                        icon: <RefreshCw size={14} />,
                        onClick: handleConnect,
                      },
                    ]}
                  />
                </div>
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
