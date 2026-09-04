"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import NextLink from "next/link";
import { getTemplates } from "@/entities/template/api";
import type { Template } from "@/entities/template/types";
import { getAccounts, getMedia } from "@/entities/ig-account/api";
import type { IgAccount, IgMedia } from "@/entities/ig-account/types";
import { TemplateWizard } from "@/features/template-management/TemplateWizard";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Button } from "@astryxdesign/core/Button";
import { Link } from "@astryxdesign/core/Link";
import { Banner } from "@astryxdesign/core/Banner";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { TemplateCard, TemplateCardSkeleton } from "./TemplateCard";

/** Число скелетон-карточек, пока реальный список ещё грузится — реальное
 * количество неизвестно заранее, фиксированное число проще и
 * предсказуемее, чем пытаться его угадать. */
const TEMPLATE_SKELETON_COUNT = 3;

export default function TemplatesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const igAccountId = params.id as string;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [media, setMedia] = useState<IgMedia[]>([]);
  // GET /api/ig-accounts/:id/media отдаёт 500, если у аккаунта протух
  // токен (см. переписку по задаче переподключения Instagram) — не
  // должно ронять ни эту страницу, ни визард, только явно показать, что
  // именно посты не загрузились (не спутать с "постов реально нет").
  const [mediaError, setMediaError] = useState(false);
  const [account, setAccount] = useState<IgAccount | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(
    null,
  );

  async function loadData() {
    setLoading(true);
    setAccountLoading(true);
    setMediaError(false);

    // allSettled, не all — media отдельно, потому что именно она падает
    // 500-кой на мёртвом IG-токене (см. состояние mediaError выше);
    // шаблоны и список аккаунтов при этом загружаются нормально и не
    // должны падать вместе с ней.
    const [tplResult, mediaResult, accountsResult] = await Promise.allSettled([
      getTemplates(igAccountId),
      getMedia(igAccountId),
      getAccounts(),
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

    if (accountsResult.status === "fulfilled") {
      setAccount(
        accountsResult.value.accounts?.find((a) => a.id === igAccountId) ??
          null,
      );
    }

    setAccountLoading(false);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [igAccountId]);

  // Точка входа с карточек "Начать здесь" на /dashboard: ?newTemplate=1
  // сразу открывает визард создания шаблона на этой странице, не заставляя
  // юзера ещё раз нажимать "+ Новый шаблон" — единственная существующая
  // точка входа, через которую можно передать намерение "создать
  // автоматизацию" из главной. Открываем один раз за монтирование.
  const openedFromQueryRef = useRef(false);
  useEffect(() => {
    if (openedFromQueryRef.current) return;
    if (searchParams.get("newTemplate") === "1") {
      openedFromQueryRef.current = true;
      openNewForm();
    }
  }, [searchParams]);

  function openNewForm() {
    setEditingTemplate(null);
    setWizardOpen(true);
  }

  function openEditForm(tpl: Template) {
    setEditingTemplate(tpl);
    setWizardOpen(true);
  }

  async function handleWizardSaved() {
    setWizardOpen(false);
    await loadData();
  }

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
          onClick={openNewForm}
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
              onEdit={() => openEditForm(tpl)}
              onDeleted={handleTemplateDeleted}
              onToggled={handleTemplateToggled}
            />
          ))}
        </Stack>
      )}

      {wizardOpen && (
        <TemplateWizard
          igAccountId={igAccountId}
          username={account?.username ?? ""}
          usernameLoading={accountLoading}
          // TODO: backend пока не подтверждено отдаёт ли avatar_url (см.
          // задачу "проверить profile_picture_url в graph.instagram.com для
          // self-serve OAuth-аккаунтов"). Пока account.avatar_url всегда
          // undefined/null — PhonePreview корректно откатывается на
          // буквенный fallback.
          avatarUrl={account?.avatar_url ?? null}
          media={media}
          mediaError={mediaError}
          existingTemplates={templates}
          editingTemplate={editingTemplate}
          onClose={() => setWizardOpen(false)}
          onSaved={handleWizardSaved}
        />
      )}
    </div>
  );
}
