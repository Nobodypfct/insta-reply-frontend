"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Zap, Users } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { getAccounts } from "@/entities/ig-account/api";
import type { IgAccount } from "@/entities/ig-account/types";
import { getTemplates } from "@/entities/template/api";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Badge } from "@astryxdesign/core/Badge";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { StatsRow } from "./StatsRow";
import { OnboardingChecklist } from "./OnboardingChecklist";
import {
  RecentTemplatesCard,
  type RecentTemplateEntry,
} from "./RecentTemplatesCard";

type StarterCard = {
  title: string;
  popular?: boolean;
  // Технических флоу — 2 (см. entities/template/types.ts "План: типы
  // автоматизаций"): "Автоответ на комментарии" и "Собирайте лиды через
  // комментарии" — один и тот же comment→DM механизм под разным
  // маркетинговым текстом, ведут в один и тот же визард; "Отвечайте на
  // все DM" — генуинно другой (DmTemplateWizard).
  templateType: "comment" | "dm";
};

const STARTER_CARDS: StarterCard[] = [
  { title: "Автоответ на комментарии", popular: true, templateType: "comment" },
  { title: "Собирайте лиды через комментарии", templateType: "comment" },
  { title: "Отвечайте на все DM", templateType: "dm" },
];

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
  const [templateEntries, setTemplateEntries] = useState<
    RecentTemplateEntry[]
  >([]);
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
    <div className="mx-auto max-w-6xl px-8 py-8">
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

      <Heading level={1} className="mb-6 text-2xl font-semibold">
        Главная
      </Heading>

      {/* Скелетон вместо голого "Загрузка…" — те же размеры, что и
          реальный контент, чтобы страница не "прыгала" при подгрузке. */}
      {loading ? (
        <>
          <Skeleton width={280} height={52} radius={2} />
          <div className="mb-8 mt-3">
            <Skeleton width={220} height={20} radius={2} />
          </div>
        </>
      ) : (
        <>
          <Heading level={2} className="mb-6 break-words text-5xl font-bold">
            Привет, {displayName}!
          </Heading>

          {hasAccount ? (
            <StatsRow
              accountsCount={accounts.length}
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

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          {/* Приглушаем секцию, когда подключать автоответ ещё не к чему —
              карточки при этом остаются кликабельными: href уже безопасно
              уводит на /dashboard/accounts, когда accounts.length !== 1
              (см. ветвление ниже, не менялось). */}
          <div className={!hasAccount && !loading ? "opacity-50" : undefined}>
            <Heading level={3} className="mb-4 text-xl font-semibold">
              Начать здесь
            </Heading>

            <div className="flex flex-wrap gap-4">
              {STARTER_CARDS.map((card) => (
                <ClickableCard
                  key={card.title}
                  href={
                    accounts.length === 1
                      ? `/dashboard/accounts/${accounts[0].id}/templates/new/${card.templateType}`
                      : "/dashboard/accounts"
                  }
                  label={card.title}
                  padding={4}
                  width={280}
                >
                  <Text weight="medium" className="mb-4 block">
                    {card.title}
                  </Text>
                  <div className="flex items-center justify-between gap-2">
                    <Text
                      color="secondary"
                      type="supporting"
                      className="flex items-center gap-1.5"
                    >
                      <Zap size={14} className="shrink-0" />
                      Быстрая автоматизация
                    </Text>
                    {card.popular && (
                      <Badge
                        variant="orange"
                        label="ПОПУЛЯРНОЕ"
                        className="shrink-0"
                      />
                    )}
                  </div>
                </ClickableCard>
              ))}
            </div>
          </div>
          {!hasAccount && !loading && (
            <Text color="secondary" type="supporting" className="mt-3 block">
              Сначала подключите аккаунт — тогда карточки заработают.
            </Text>
          )}
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
