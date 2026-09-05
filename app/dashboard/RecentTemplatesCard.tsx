"use client";

import { useState } from "react";
import NextLink from "next/link";
import { MessageSquare, MessagesSquare } from "lucide-react";
import { toggleTemplateActive } from "@/entities/template/api";
import type { Template } from "@/entities/template/types";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { Switch } from "@astryxdesign/core/Switch";
import { EmptyState } from "@astryxdesign/core/EmptyState";

export type RecentTemplateEntry = {
  accountId: string;
  template: Template;
};

/** Одна строка списка — свой локальный `isActive`/`error`, тот же паттерн
 * (`changeAction` не ловит реджект сам — см. TemplateCard.tsx и CLAUDE.md
 * "ГРАБЛИ: Switch's changeAction"), чтобы ошибка одной строки не мешала
 * соседним и не роняла страницу. */
function RecentTemplateRow({ entry }: { entry: RecentTemplateEntry }) {
  const { accountId, template: tpl } = entry;
  const [isActive, setIsActive] = useState(tpl.is_active);
  const [error, setError] = useState<string | null>(null);
  const isDm = tpl.type === "dm";
  const displayName =
    tpl.name?.trim() || (isDm ? "Ответ в директ" : "Автоответ на комментарии");
  const detailHref = `/dashboard/accounts/${accountId}/templates/${tpl.id}`;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-accent">
          {isDm ? <MessagesSquare size={15} /> : <MessageSquare size={15} />}
        </div>
        {/* Link не принимает className — усечение и раскладка через его
            собственные пропы (maxLines/display), обёртка снаружи под flex-1 */}
        <div className="min-w-0 flex-1">
          <Link href={detailHref} as={NextLink} isStandalone maxLines={1}>
            {displayName}
          </Link>
        </div>
        <Switch
          label={`Активен: ${displayName}`}
          isLabelHidden
          size="sm"
          value={isActive}
          changeAction={async (checked) => {
            try {
              await toggleTemplateActive(tpl.id, checked);
              setIsActive(checked);
              setError(null);
            } catch {
              setError(
                checked
                  ? "Не удалось включить шаблон."
                  : "Не удалось выключить шаблон.",
              );
            }
          }}
        />
      </div>
      {error && (
        <Text type="supporting" className="ml-11 text-error">
          {error}
        </Text>
      )}
    </div>
  );
}

/**
 * "Последние шаблоны" — редизайн 2026-09, заменяет собой абстрактную
 * "ленту активности" из первых набросков Claude Design канваса (там не
 * было под что взять реальные данные — глобального event-лога на бэкенде
 * нет, см. CLAUDE.md "Аналитика шаблонов"). Список СОБРАН на фронте из
 * `getTemplates()` по каждому подключённому аккаунту (entities/template/
 * api.ts, без изменений) — у `Template` нет поля даты создания, так что
 * "последние" — лучшее доступное приближение (последние в порядке, в
 * котором их отдаёт бэкенд), не honest chronological sort.
 */
export function RecentTemplatesCard({
  entries,
}: {
  entries: RecentTemplateEntry[];
}) {
  return (
    <Card padding={5} elevation="low">
      <div className="mb-4 flex items-center justify-between">
        <Text weight="medium">Последние шаблоны</Text>
        <Link href="/dashboard/accounts" as={NextLink} isStandalone size="sm">
          Все
        </Link>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          isCompact
          title="Шаблонов пока нет"
          description="Создайте первый через карточки ниже."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {entries.map((entry) => (
            <RecentTemplateRow key={entry.template.id} entry={entry} />
          ))}
        </div>
      )}
    </Card>
  );
}
