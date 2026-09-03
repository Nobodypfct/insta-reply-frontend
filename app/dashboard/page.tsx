"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { createClient } from "@/lib/supabase";
import { getAccounts } from "@/entities/ig-account/api";
import { getTemplates } from "@/entities/template/api";
import type { IgAccount } from "@/entities/ig-account/types";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";

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

export default function DashboardOverviewPage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
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
      setUserId(data.user.id);
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

  function handleConnect() {
    if (!userId) return;
    signIn("instagram", { callbackUrl: "/instagram-connected" });
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Text color="secondary">Загрузка…</Text>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Heading level={1} className="mb-6 text-xl font-medium">
        Главная
      </Heading>

      <Heading level={2} className="break-words text-3xl font-bold">
        Привет, {displayName}!
      </Heading>

      <Text color="secondary" className="mt-2 block">
        {accountsCountLabel(accounts.length)}{" "}
        <Link href="/dashboard/accounts">Смотреть все</Link>
      </Text>

      {(accounts.length === 0 || !hasAnyTemplate) && (
        <div className="mt-10">
          <Heading level={3} className="mb-4 text-lg font-medium">
            Начать здесь
          </Heading>

          {accounts.length === 0 ? (
            <Card padding={5} maxWidth={420}>
              <Text weight="medium" className="mb-1 block">
                Подключите первый Instagram-аккаунт
              </Text>
              <Text color="secondary" type="supporting" className="mb-4 block">
                Чтобы включить автоответ на комментарии и DM.
              </Text>
              <Button
                variant="primary"
                label="Подключить Instagram"
                onClick={handleConnect}
              />
            </Card>
          ) : (
            <Card padding={5} maxWidth={420}>
              <Text weight="medium" className="mb-1 block">
                Создайте первый шаблон автоответа
              </Text>
              <Text color="secondary" type="supporting" className="mb-4 block">
                Шаблон настраивается для конкретного подключённого аккаунта.
              </Text>
              <Link href="/dashboard/accounts">Перейти к аккаунтам</Link>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
