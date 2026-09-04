"use client";

import { useParams, useRouter } from "next/navigation";
import NextLink from "next/link";
import { Spinner } from "@astryxdesign/core/Spinner";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { Button } from "@astryxdesign/core/Button";
import { TemplateAnalyticsSection } from "@/features/template-management/TemplateAnalyticsSection";
import { TemplateReadOnlyPreview } from "@/features/template-management/TemplateReadOnlyPreview";
import { useTemplatesRoute } from "../TemplatesContext";

/**
 * Страница деталей ОДНОГО шаблона — просмотр (аналитика + превью
 * телефона), не форма. "Изменить" из карточки списка (TemplateCard)
 * теперь ведёт СЮДА, не сразу в `/edit` — открыть автоматизацию значит
 * сначала увидеть её метрики, а не сразу нырнуть в форму (тот же
 * порядок, что у референса конкурента — карточка → детали →
 * "Редактировать" → форма).
 */
export default function TemplateDetailPage() {
  const params = useParams();
  const templateId = params.templateId as string;
  const router = useRouter();
  const { igAccountId, account, accountLoading, media, templates, loading } =
    useTemplatesRoute();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const template = templates.find((t) => t.id === templateId) ?? null;

  if (!template) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <EmptyState
          title="Шаблон не найден"
          description="Возможно, он был удалён."
        />
      </div>
    );
  }

  // Отсутствующее название — старые шаблоны, созданные до появления поля
  // (см. entities/template/types.ts) — тот же принцип, что у type/null:
  // не ошибка, честный дефолт по типу шаблона, не "undefined" на экране.
  const displayName =
    template.name?.trim() ||
    (template.type === "dm" ? "Ответ в директ" : "Автоответ на комментарии");

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link
        href={`/dashboard/accounts/${igAccountId}`}
        as={NextLink}
        className="mb-6 inline-block"
      >
        ← Назад к шаблонам
      </Link>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <Text color="secondary" type="supporting" className="block">
                @{account?.username}
              </Text>
              <Heading level={1} className="text-xl font-medium">
                {displayName}
              </Heading>
            </div>
            <Button
              variant="primary"
              label="Редактировать"
              onClick={() =>
                router.push(
                  `/dashboard/accounts/${igAccountId}/templates/${templateId}/edit`,
                )
              }
            />
          </div>

          <TemplateAnalyticsSection analytics={template.analytics} />
        </div>

        <div className="flex justify-center lg:w-[340px] lg:shrink-0">
          <TemplateReadOnlyPreview
            template={template}
            media={media}
            username={account?.username ?? ""}
            usernameLoading={accountLoading}
            avatarUrl={account?.avatar_url ?? null}
          />
        </div>
      </div>
    </div>
  );
}
