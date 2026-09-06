"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { getAccounts } from "@/entities/ig-account/api";
import type { IgAccount } from "@/entities/ig-account/types";
import { getTemplates } from "@/entities/template/api";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { StatsRow } from "./StatsRow";
import { StarterCards } from "./StarterCards";
import { OnboardingChecklist } from "./OnboardingChecklist";
import {
  RecentTemplatesCard,
  type RecentTemplateEntry,
} from "./RecentTemplatesCard";

function DashboardContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  // `next=/dashboard` — редирект по умолчанию после подтверждения email
  // (см. app/auth/confirm/route.ts, CLAUDE.md "Supabase Auth"). Раньше
  // этот баннер существовал ТОЛЬКО на /dashboard/accounts — юзер, только
  // что подтвердивший почту, попадал именно сюда (Главная) и никогда его
  // не видел. Тот же паттерн чтения query-параметра, что уже на
  // /dashboard/accounts.
  const emailVerified = searchParams.get("verified") === "1";

  const [displayName, setDisplayName] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<IgAccount[]>([]);
  const [templateEntries, setTemplateEntries] = useState<RecentTemplateEntry[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      // Гейт живёт в app/dashboard/layout.tsx (+ proxy.ts) — сюда без
      // сессии не попасть; проверка ниже чисто для сужения типа.
      if (!data.user) return;
      setUserId(data.user.id);
      setDisplayName(
        data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email ||
          "",
      );

      try {
        const accountsJson = await getAccounts();
        const accs = accountsJson.accounts || [];
        setAccounts(accs);

        // Шаблоны по всем аккаунтам — новое для редизайна (чек-лист,
        // "Последние шаблоны", стат-плашки); getTemplates() сам не
        // менялся. Promise.allSettled — тот же принцип устойчивости к
        // частичному провалу токена, что уже применялся на странице
        // аккаунта (см. CLAUDE.md "Переподключение Instagram — часть A"):
        // дохлый токен на ОДНОМ аккаунте не должен прятать шаблоны
        // остальных.
        const results = await Promise.allSettled(
          accs.map((acc) =>
            getTemplates(acc.id).then((r) => ({
              accountId: acc.id,
              templates: r.templates || [],
            })),
          ),
        );
        const entries: RecentTemplateEntry[] = [];
        for (const result of results) {
          if (result.status === "fulfilled") {
            for (const template of result.value.templates) {
              entries.push({ accountId: result.value.accountId, template });
            }
          }
        }
        setTemplateEntries(entries);
      } catch {
        setLoadError(true);
      }

      setLoading(false);
    }
    init();
  }, []);

  function handleConnect() {
    if (!userId) return;
    signIn("instagram", { callbackUrl: "/instagram-connected" });
  }

  const hasAccount = accounts.length > 0;
  const activeCount = templateEntries.filter(
    (e) => e.template.is_active,
  ).length;
  const inactiveCount = templateEntries.length - activeCount;
  const hasTemplate = templateEntries.length > 0;
  const hasActiveTemplate = activeCount > 0;
  // Лучшее доступное приближение "последних" — у Template нет поля даты
  // создания, см. комментарий в RecentTemplatesCard.tsx.
  const recentEntries = templateEntries.slice(-3).reverse();

  return (
    <div className="px-8 py-8">
      {emailVerified && (
        <div className="mb-6">
          <Banner
            status="success"
            title="Email подтверждён, добро пожаловать! 🎉"
          />
        </div>
      )}
      {loadError && (
        <div className="mb-6">
          <Banner
            status="error"
            title="Не удалось загрузить часть данных"
            description="Обновите страницу или попробуйте ещё раз чуть позже."
          />
        </div>
      )}

      {/* Две колонки от самого верха: правый рельс (чек-лист + последние
          шаблоны) начинается на одной высоте с приветствием, как на макете,
          а не под блоком статистики. */}
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <div className="min-w-0 flex-1">
          {/* Надзаголовок-эйбрау, не отдельный <h1>: настоящий заголовок
              страницы — само приветствие ниже. */}
          <Text
            type="label"
            color="secondary"
            className="mb-2.5 block text-[13px] font-bold uppercase tracking-[0.06em]"
          >
            Главная
          </Text>

          {/* Скелетон вместо голого "Загрузка…" — те же размеры, что и
              реальный контент, чтобы страница не "прыгала" при подгрузке. */}
          {loading ? (
            <>
              <Skeleton width={280} height={38} radius={2} />
              <div className="mb-8 mt-4">
                <Skeleton width={520} height={96} radius={2} />
              </div>
            </>
          ) : (
            <>
              <Heading
                level={1}
                className="mb-8 break-words text-[30px] font-extrabold leading-tight tracking-tight"
              >
                Привет, {displayName}!
              </Heading>

              {hasAccount ? (
                <StatsRow
                  accounts={accounts}
                  activeTemplatesCount={activeCount}
                  inactiveTemplatesCount={inactiveCount}
                  loading={false}
                />
              ) : (
                <div className="mb-8">
                  <EmptyState
                    icon={<Users size={32} />}
                    title="Пока нет подключённых аккаунтов"
                    description="Подключите Instagram, чтобы включить автоответ на комментарии и DM."
                    actions={
                      <Button
                        variant="primary"
                        label="Подключить Instagram"
                        onClick={handleConnect}
                      />
                    }
                  />
                </div>
              )}
            </>
          )}

          {/* Приглушаем секцию, когда подключать автоответ ещё не к чему —
              карточки при этом остаются кликабельными: href уже безопасно
              уводит на /dashboard/accounts, когда accounts.length !== 1
              (см. ветвление ниже, не менялось). */}
          <div className={!hasAccount && !loading ? "opacity-50" : undefined}>
            <Heading
              level={2}
              className="mb-[18px] text-[17px] font-extrabold tracking-tight"
            >
              Начать здесь
            </Heading>

            <StarterCards accounts={accounts} />

            {!hasAccount && !loading && (
              <Text color="secondary" type="supporting" className="mt-3 block">
                Сначала подключите аккаунт — тогда карточки заработают.
              </Text>
            )}
          </div>
        </div>

        {!loading && (
          <div className="flex w-full flex-col gap-4 lg:w-[300px] lg:shrink-0">
            <OnboardingChecklist
              hasAccount={hasAccount}
              hasTemplate={hasTemplate}
              hasActiveTemplate={hasActiveTemplate}
            />
            <RecentTemplatesCard entries={recentEntries} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardOverviewPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
