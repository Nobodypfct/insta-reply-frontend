"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import NextLink from "next/link";
import { ShieldCheck } from "lucide-react";
import {
  getTemplates,
  deleteTemplate,
  toggleTemplateActive,
} from "@/entities/template/api";
import type { Template } from "@/entities/template/types";
import { getAccounts, getMedia } from "@/entities/ig-account/api";
import type { IgAccount, IgMedia } from "@/entities/ig-account/types";
import { TemplateWizard } from "@/features/template-management/TemplateWizard";
import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Link } from "@astryxdesign/core/Link";
import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { ActiveStatusBadge } from "@/shared/components/ActiveStatusBadge";

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

  async function handleDelete(templateId: string) {
    await deleteTemplate(templateId);
    await loadData();
  }

  async function handleToggleActive(tpl: Template) {
    await toggleTemplateActive(tpl.id, !tpl.is_active);
    await loadData();
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
        <Text color="secondary">Загрузка…</Text>
      ) : templates.length === 0 ? (
        <EmptyState title="Пока нет шаблонов" description="Создайте первый." />
      ) : (
        <Stack gap={3}>
          {templates.map((tpl) => {
            const post = findMedia(tpl.post_id);
            return (
              <Card key={tpl.id} padding={5}>
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {post?.thumbnail_url || post?.media_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.thumbnail_url || post.media_url}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xs">
                        {tpl.post_id ? "📷" : "∀"}
                      </div>
                    )}
                    <div>
                      <Text weight="medium">
                        {tpl.post_id ? "Конкретный пост" : "Все посты"}
                      </Text>
                      {tpl.keyword && (
                        <Text
                          color="secondary"
                          type="supporting"
                          className="mt-0.5 block"
                        >
                          слово-триггер:{" "}
                          <Text color="accent">{tpl.keyword}</Text>
                        </Text>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {tpl.require_follow_check && (
                      <Badge
                        variant="blue"
                        icon={<ShieldCheck size={12} />}
                        label="Подписка"
                      />
                    )}
                    <ActiveStatusBadge isActive={tpl.is_active} />
                  </div>
                </div>

                <Stack gap={1} className="mb-4">
                  <Text color="secondary" type="supporting">
                    Ответы на коммент:{" "}
                    {tpl.template_replies?.map((r) => r.text).join(" · ")}
                  </Text>
                  <Text color="secondary" type="supporting">
                    DM: {tpl.dm_text}
                  </Text>
                </Stack>

                <div className="flex items-center gap-2">
                  <Link onClick={() => openEditForm(tpl)}>Изменить</Link>
                  <Text color="disabled">·</Text>
                  <Link onClick={() => handleToggleActive(tpl)}>
                    {tpl.is_active ? "Выключить" : "Включить"}
                  </Link>
                  <Text color="disabled">·</Text>
                  <Link
                    onClick={() => handleDelete(tpl.id)}
                    className="text-error"
                  >
                    Удалить
                  </Link>
                </div>
              </Card>
            );
          })}
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
