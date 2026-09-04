"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import NextLink from "next/link";
import { getTemplates } from "@/entities/template/api";
import type { Template } from "@/entities/template/types";
import { getMedia } from "@/entities/ig-account/api";
import type { IgMedia } from "@/entities/ig-account/types";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Button } from "@astryxdesign/core/Button";
import { Link } from "@astryxdesign/core/Link";
import { Banner } from "@astryxdesign/core/Banner";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { TemplateCard, TemplateCardSkeleton } from "./TemplateCard";
import { TemplateTypePicker } from "@/features/template-management/TemplateTypePicker";

/** Число скелетон-карточек, пока реальный список ещё грузится — реальное
 * количество неизвестно заранее, фиксированное число проще и
 * предсказуемее, чем пытаться его угадать. */
const TEMPLATE_SKELETON_COUNT = 3;

export default function TemplatesPage() {
  const params = useParams();
  const router = useRouter();
  const igAccountId = params.id as string;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [media, setMedia] = useState<IgMedia[]>([]);
  // GET /api/ig-accounts/:id/media отдаёт 500, если у аккаунта протух
  // токен (см. переписку по задаче переподключения Instagram) — не
  // должно ронять эту страницу, только явно показать, что именно посты
  // не загрузились (не спутать с "постов реально нет").
  const [mediaError, setMediaError] = useState(false);
  const [loading, setLoading] = useState(true);
  // Попап выбора типа автоматизации ("+ Новый шаблон") — сама форма
  // создания/редактирования теперь отдельные роуты (app/dashboard/
  // accounts/[id]/templates/**, см. TemplatesContext.tsx), не оверлей на
  // этой странице, поэтому account/avatar здесь больше не нужны — их
  // грузит templates/layout.tsx для тех роутов самостоятельно.
  const [pickerOpen, setPickerOpen] = useState(false);

  async function loadData() {
    setLoading(true);
    setMediaError(false);

    // allSettled, не all — media отдельно, потому что именно она падает
    // 500-кой на мёртвом IG-токене (см. состояние mediaError выше);
    // шаблоны при этом загружаются нормально и не должны падать вместе
    // с ней.
    const [tplResult, mediaResult] = await Promise.allSettled([
      getTemplates(igAccountId),
      getMedia(igAccountId),
    ]);

    if (tplResult.status === "fulfilled") {
      setTemplates(tplResult.value.templates || []);
    }

    if (mediaResult.status === "fulfilled") {
      setMedia(mediaResult.value.media || []);
    } else {
      setMedia([]);
      setMediaError(true);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [igAccountId]);

  // Точечные локальные обновления — не рефетч. Мутации (сам API-вызов)
  // теперь живут внутри TemplateCard, сюда прилетает уже готовый
  // результат: удалить/переключить конкретную карточку в уже загруженном
  // массиве, не трогая остальные и не показывая общий "Загрузка…" на весь
  // список ради одной изменившейся карточки (см. переписку).
  function handleTemplateDeleted(templateId: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
  }

  function handleTemplateToggled(templateId: string, isActive: boolean) {
    setTemplates((prev) =>
      prev.map((t) => (t.id === templateId ? { ...t, is_active: isActive } : t)),
    );
  }

  function findMedia(postId: string | null) {
    return media.find((m) => m.id === postId);
  }

  function handleTypeSelected(type: "comment" | "dm") {
    setPickerOpen(false);
    router.push(`/dashboard/accounts/${igAccountId}/templates/new/${type}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link
        href="/dashboard/accounts"
        as={NextLink}
        className="mb-6 inline-block"
      >
        ← Назад к аккаунтам
      </Link>

      <div className="mb-8 flex items-center justify-between">
        <Heading level={1} className="text-xl font-medium">
          Шаблоны автоответов
        </Heading>
        <Button
          variant="primary"
          label="+ Новый шаблон"
          onClick={() => setPickerOpen(true)}
        />
      </div>

      {!loading && mediaError && (
        <Banner
          status="warning"
          title="Не удалось загрузить посты"
          description="Возможно, у аккаунта истёк доступ к Instagram — попробуйте переподключить его на странице аккаунтов. Шаблоны и остальные функции работают как обычно."
          className="mb-6"
        />
      )}

      {loading ? (
        <Stack gap={3}>
          {Array.from({ length: TEMPLATE_SKELETON_COUNT }).map((_, i) => (
            <TemplateCardSkeleton key={i} index={i} />
          ))}
        </Stack>
      ) : templates.length === 0 ? (
        <EmptyState title="Пока нет шаблонов" description="Создайте первый." />
      ) : (
        <Stack gap={3}>
          {templates.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              template={tpl}
              post={findMedia(tpl.post_id)}
              editHref={`/dashboard/accounts/${igAccountId}/templates/${tpl.id}/edit`}
              onDeleted={handleTemplateDeleted}
              onToggled={handleTemplateToggled}
            />
          ))}
        </Stack>
      )}

      <TemplateTypePicker
        isOpen={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleTypeSelected}
      />
    </div>
  );
}
