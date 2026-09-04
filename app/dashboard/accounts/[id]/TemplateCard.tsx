"use client";

import { useState } from "react";
import NextLink from "next/link";
import { ShieldCheck, MessagesSquare } from "lucide-react";
import { deleteTemplate, toggleTemplateActive } from "@/entities/template/api";
import type { Template } from "@/entities/template/types";
import type { IgMedia } from "@/entities/ig-account/types";
import { Card } from "@astryxdesign/core/Card";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { Badge } from "@astryxdesign/core/Badge";
import { Switch } from "@astryxdesign/core/Switch";
import { Skeleton } from "@astryxdesign/core/Skeleton";

/**
 * Один шаблон — вынесен из page.tsx в отдельный компонент ради ЛОКАЛЬНОГО
 * состояния мутаций (удаление/переключение): раньше обе мутации дёргали
 * page-level `loadData()`, который перезапрашивал ВСЁ (шаблоны+медиа+
 * аккаунты) и ставил на паузу весь список одним общим "Загрузка…" —
 * теперь у каждой карточки своё состояние, соседние карточки не мигают.
 *
 * Не заводили под это TanStack Query — на проекте пока нет ни одного
 * места, где серверные данные шарятся между компонентами/страницами
 * (единственный кэш, который тут вообще нужен — "не рефетчить всё после
 * точечной мутации"), обычный локальный `useState` + оптимистичное
 * обновление массива в родителе полностью закрывают это без новой
 * зависимости и provider'а.
 */
export function TemplateCard({
  template: tpl,
  post,
  detailHref,
  onDeleted,
  onToggled,
}: {
  template: Template;
  post: Pick<IgMedia, "thumbnail_url" | "media_url"> | undefined;
  detailHref: string;
  onDeleted: (templateId: string) => void;
  onToggled: (templateId: string, isActive: boolean) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Отсутствующий/null type — шаблоны, созданные до появления
  // дискриминатора (см. entities/template/types.ts) — трактуем как
  // "comment", единственный тип, который вообще существовал раньше.
  const isDm = tpl.type === "dm";
  const typeLabel = isDm
    ? "Ответ в директ"
    : tpl.post_id
      ? "Конкретный пост"
      : "Все посты";
  // Отсутствующее название — старые шаблоны, созданные до появления поля
  // (см. entities/template/types.ts) — честный дефолт по типу, не пустая
  // строка/undefined на карточке.
  const displayName = tpl.name?.trim() || typeLabel;

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteTemplate(tpl.id);
      onDeleted(tpl.id);
    } catch {
      // Откатываем состояние, а не оставляем карточку навсегда в "Удаление…"
      // — тот же принцип, что и раньше не соблюдался (loadData() без
      // try/catch просто уронил бы страницу), но теперь ошибка не рушит
      // весь список, а видна прямо на карточке.
      setIsDeleting(false);
      setError("Не удалось удалить шаблон. Попробуйте ещё раз.");
    }
  }

  return (
    <Card key={tpl.id} padding={5}>
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {isDm ? (
            // DM-шаблон не завязан на пост вообще — своя иконка (та же,
            // что в TemplateTypePicker), не превью поста/буквенная
            // заглушка post_id-веток ниже.
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-accent">
              <MessagesSquare size={18} />
            </div>
          ) : post?.thumbnail_url || post?.media_url ? (
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
          <div className="min-w-0">
            <Text weight="medium" className="block truncate">
              {displayName}
            </Text>
            <Text color="secondary" type="supporting" className="mt-0.5 block">
              {typeLabel}
            </Text>
            {tpl.keyword && (
              <Text color="secondary" type="supporting" className="mt-0.5 block">
                слово-триггер: <Text color="accent">{tpl.keyword}</Text>
              </Text>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {tpl.require_follow_check && (
            <Badge
              variant="blue"
              icon={<ShieldCheck size={12} />}
              label="Подписка"
            />
          )}
          {/* Один Switch вместо (полоски-статуса + отдельной текстовой
              ссылки "Включить"/"Выключить") — сам одновременно показывает
              состояние И является действием. `changeAction` — Astryx сам
              крутит спиннер в трее, пока промис не резолвится, и показывает
              новое значение оптимистично, ПОКА промис ждёт. Но — проверено
              вручную (симулировал сетевую ошибку) — сам он реджект НЕ
              ловит, он улетает дальше необработанным и рушит страницу.
              Поэтому try/catch тут наш, вручную: при ошибке НЕ зовём
              onToggled — `value` остаётся прежним, Switch откатится сам,
              раз его источник истины (controlled `value`) не изменился.
              Родителю сообщаем ТОЛЬКО после успеха, чтобы наш локальный
              список синхронизировался с реальным результатом, а не с
              оптимистичным предположением. */}
          <Switch
            label="Активна"
            isLabelHidden
            size="sm"
            value={tpl.is_active}
            isDisabled={isDeleting}
            changeAction={async (checked) => {
              try {
                await toggleTemplateActive(tpl.id, checked);
                onToggled(tpl.id, checked);
                setError(null);
              } catch {
                setError(
                  checked
                    ? "Не удалось включить шаблон. Попробуйте ещё раз."
                    : "Не удалось выключить шаблон. Попробуйте ещё раз.",
                );
              }
            }}
          />
        </div>
      </div>

      <Stack gap={1} className="mb-4">
        {/* "Ответы на коммент" — только у comment-типа, у DM-триггера нет
            отдельного ответа НА КОММЕНТАРИЙ (template_replies), только
            сам ответный DM-текст ниже. */}
        {!isDm && (
          <Text color="secondary" type="supporting">
            Ответы на коммент:{" "}
            {tpl.template_replies?.map((r) => r.text).join(" · ")}
          </Text>
        )}
        <Text color="secondary" type="supporting">
          DM: {tpl.dm_text}
        </Text>
      </Stack>

      {error && (
        <Text type="supporting" className="mb-2 block text-error">
          {error}
        </Text>
      )}

      <div className="flex items-center gap-2">
        {/* Ведёт на страницу деталей (метрики + превью), не сразу в форму
            редактирования — там уже своя кнопка "Редактировать" (см.
            app/dashboard/accounts/[id]/templates/[templateId]/page.tsx).
            Поэтому "Открыть", не "Изменить" — точнее описывает переход. */}
        <Link href={detailHref} as={NextLink} isDisabled={isDeleting}>
          Открыть
        </Link>
        <Text color="disabled">·</Text>
        <Link onClick={handleDelete} isDisabled={isDeleting} className="text-error">
          {isDeleting ? "Удаление…" : "Удалить"}
        </Link>
      </div>
    </Card>
  );
}

/** Форма скелетона повторяет реальную карточку (аватар-квадрат + 2 строки
 * заголовка + место под Switch, 2 строки текста, ряд действий) — по
 * гайду самого Astryx ("match the size and shape of the content being
 * loaded"). `index` — для лёгкого волнового эффекта между 3 карточками. */
export function TemplateCardSkeleton({ index }: { index: number }) {
  return (
    <Card padding={5}>
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton width={40} height={40} radius={2} index={index} />
          <div className="flex flex-col gap-2">
            <Skeleton width={120} height={14} index={index} />
            <Skeleton width={160} height={12} index={index} />
          </div>
        </div>
        <Skeleton width={36} height={20} radius="rounded" index={index} />
      </div>
      <div className="mb-4 flex flex-col gap-2">
        <Skeleton width="90%" height={12} index={index} />
        <Skeleton width="70%" height={12} index={index} />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton width={60} height={12} index={index} />
        <Skeleton width={60} height={12} index={index} />
      </div>
    </Card>
  );
}
