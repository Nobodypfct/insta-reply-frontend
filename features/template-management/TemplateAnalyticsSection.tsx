import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import type { TemplateAnalytics } from "@/entities/template/types";

/**
 * "Ключевые метрики" на странице деталей шаблона (app/dashboard/accounts/
 * [id]/templates/[templateId]/page.tsx) — воронка из 3-х чисел, референс —
 * ChatPlace-style экран (скриншот в переписке), НЕ ManyChat's Sends/
 * Clicks/CTR/Emails (обсуждали и отказались — см. CLAUDE.md, "Аналитика
 * шаблонов"): 3 абсолютных числа читаются как воронка сами по себе, без
 * вычисляемого процента, который зависит от выбора знаменателя.
 *
 * Пока БЕЗ фильтра периода (7 дней/30 дней/Всё время, как на референсе) —
 * это отдельная задача (нужен time-series на бэкенде, не просто счётчик),
 * см. TODO/промпт. Тут — только "за всё время".
 */
export function TemplateAnalyticsSection({
  analytics,
}: {
  analytics: TemplateAnalytics | null | undefined;
}) {
  return (
    <div className="mb-8">
      <Heading level={2} className="mb-4 text-lg font-medium">
        Аналитика
      </Heading>

      {!analytics ? (
        // Бэкенд ещё не отдаёт аналитику вообще (см. TemplateAnalytics в
        // entities/template/types.ts) — честное "пока нет данных", не
        // три нуля, которые выглядели бы как "автоматизация не работает".
        <Card padding={4}>
          <Text color="secondary">
            Аналитика скоро появится здесь — мы уже готовим её на своей
            стороне.
          </Text>
        </Card>
      ) : (
        <Stack gap={3} className="flex-row">
          <StatCard label="Запустили" value={analytics.started} />
          <StatCard label="Получили ссылку" value={analytics.linkSent} />
          <StatCard label="Открыли ссылку" value={analytics.linkClicked} />
        </Stack>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card padding={4} className="flex-1">
      <Text color="secondary" type="supporting" className="mb-2 block">
        {label}
      </Text>
      <Text size="2xl" weight="bold">
        {value}
      </Text>
    </Card>
  );
}
