"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { getAccounts } from "@/entities/ig-account/api";
import { getTemplates } from "@/entities/template/api";
import type { IgAccount } from "@/entities/ig-account/types";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { Card } from "@astryxdesign/core/Card";
import { Badge } from "@astryxdesign/core/Badge";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";

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
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [accounts, setAccounts] = useState<IgAccount[]>([]);
  const [hasAnyTemplate, setHasAnyTemplate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setDisplayName(
        data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email ||
          "",
      );

      const accountsJson = await getAccounts(data.user.id);
      const loadedAccounts = accountsJson.accounts || [];
      setAccounts(loadedAccounts);

      if (loadedAccounts.length > 0) {
        const templateLists = await Promise.all(
          loadedAccounts.map((acc) => getTemplates(acc.id)),
        );
        setHasAnyTemplate(
          templateLists.some((t) => (t.templates || []).length > 0),
        );
      }

      setLoading(false);
    }
    init();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-8 py-8">
        <Text color="secondary">Загрузка…</Text>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <Heading level={1} className="mb-6 text-2xl font-semibold">
        Главная
      </Heading>

      <Heading level={2} className="break-words text-5xl font-bold">
        Привет, {displayName}!
      </Heading>

      <Text color="secondary" className="mt-2 block">
        {accountsCountLabel(accounts.length)}{" "}
        <Link href="/dashboard/accounts">Смотреть все</Link>
      </Text>

      {(accounts.length === 0 || !hasAnyTemplate) && (
        <div className="mt-8">
          <Heading level={3} className="mb-4 text-xl font-semibold">
            Начать здесь
          </Heading>

          <div className="flex flex-wrap gap-4">
            {STARTER_CARDS.map((card) => (
              <ClickableCard
                key={card.title}
                href="/dashboard/accounts"
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
      )}
    </div>
  );
}
