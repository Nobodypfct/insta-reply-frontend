"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { getAccounts } from "@/entities/ig-account/api";
import type { IgAccount } from "@/entities/ig-account/types";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { Badge } from "@astryxdesign/core/Badge";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Skeleton } from "@astryxdesign/core/Skeleton";

/** "1 подключённый аккаунт" / "2 подключённых аккаунта" / "5 подключённых аккаунтов" */
function accountsCountLabel(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  let noun: string;
  if (mod100 >= 11 && mod100 <= 14) noun = "аккаунтов";
  else if (mod10 === 1) noun = "аккаунт";
  else if (mod10 >= 2 && mod10 <= 4) noun = "аккаунта";
  else noun = "аккаунтов";

  const adjective = n === 1 ? "подключённый" : "подключённых";
  return `${n} ${adjective} ${noun}`;
}

type StarterCard = {
  title: string;
  popular?: boolean;
};

// Пока ведут все три на список аккаунтов (шаблон создаётся в контексте
// конкретного аккаунта) — реальные отдельные сценарии появятся позже.
const STARTER_CARDS: StarterCard[] = [
  { title: "Автоответ на комментарии", popular: true },
  { title: "Собирайте лиды через комментарии" },
  { title: "Отвечайте на все DM" },
];

export default function DashboardOverviewPage() {
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [accounts, setAccounts] = useState<IgAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      // Гейт живёт в app/dashboard/layout.tsx (+ proxy.ts) — сюда без
      // сессии не попасть; проверка ниже чисто для сужения типа.
      if (!data.user) return;
      setDisplayName(
        data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email ||
          "",
      );

      const accountsJson = await getAccounts();
      setAccounts(accountsJson.accounts || []);

      setLoading(false);
    }
    init();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <Heading level={1} className="mb-6 text-2xl font-semibold">
        Главная
      </Heading>

      {/* Скелетон вместо голого "Загрузка…" — те же размеры, что и
          реальный контент (52px под 5xl-заголовок, 20px под строку
          счётчика), чтобы страница не "прыгала" при подгрузке. */}
      {loading ? (
        <>
          <Skeleton width={280} height={52} radius={2} />
          <div className="mt-3">
            <Skeleton width={220} height={20} radius={2} />
          </div>
        </>
      ) : (
        <>
          <Heading level={2} className="break-words text-5xl font-bold">
            Привет, {displayName}!
          </Heading>

          <Text color="secondary" className="mt-2 block">
            {accountsCountLabel(accounts.length)}{" "}
            <Link href="/dashboard/accounts">Смотреть все</Link>
          </Text>
        </>
      )}

      <div className="mt-8">
        <Heading level={3} className="mb-4 text-xl font-semibold">
          Начать здесь
        </Heading>

        {/*
          Единственный существующий флоу создания шаблона — TemplateWizard,
          открываемый со страницы конкретного аккаунта. Если аккаунт ровно
          один — ведём прямиком туда с ?newTemplate=1 (страница сама
          откроет визард, см. dashboard/accounts/[id]/page.tsx). Если
          аккаунтов 0 или больше одного — ведём на список: нечего/не с кем
          выбрать однозначно.

          Рендерится БЕЗУСЛОВНО, не дожидаясь loading — сама вёрстка карточек
          не зависит от аккаунтов вообще, зависит только href (см. ниже).
          Пока accounts ещё не загрузились (дефолт — []), accounts.length
          === 1 ложно, href безопасно falls back на /dashboard/accounts —
          тот же код ветвления, что и после загрузки, никакого отдельного
          "disabled"-состояния специально не заводили: клик долей секунды
          раньше в худшем случае ведёт на список аккаунтов вместо прямого
          перехода, это не выглядит сломанным.

          Секция теперь показывается ВСЕГДА, а не только пока юзер ещё
          ничего не настроил (раньше пряталась через
          `accounts.length === 0 || !hasAnyTemplate` — убрано по прямому
          запросу: карточки должны быть видны как на референсе,
          безусловно).
        */}
        <div className="flex flex-wrap gap-4">
          {STARTER_CARDS.map((card) => (
            <ClickableCard
              key={card.title}
              href={
                accounts.length === 1
                  ? `/dashboard/accounts/${accounts[0].id}?newTemplate=1`
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
    </div>
  );
}
