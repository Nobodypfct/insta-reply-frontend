"use client";

import { useState } from "react";
import type { Template } from "@/entities/template/types";
import type { IgMedia } from "@/entities/ig-account/types";
import { PhonePreview, type PreviewStep } from "./PhonePreview";

/**
 * Мокап телефона на странице деталей шаблона (view-only, не визард) —
 * читает готовый `Template` с бэкенда напрямую, а не собирает пропы из
 * состояния формы (как это делают CommentTemplateWizard/DmTemplateWizard
 * для СВОЕГО черновика). PhonePreview остаётся тем же презентационным
 * компонентом, что и в визардах — эта обёртка просто маппит одну модель
 * данных на его пропы.
 *
 * Табы под мокапом ("Пост"/"Комментарии"/"Директ") у comment-шаблона
 * ЗДЕСЬ переключают экран локально (`useState`, не привязано ни к какой
 * навигации/валидации — той нет вообще на статичной странице просмотра),
 * у dm-шаблона табов нет вообще (`hideTabs` — один экран превью, тот же
 * повод, что и в самом DmTemplateWizard).
 */
export function TemplateReadOnlyPreview({
  template,
  media,
  username,
  usernameLoading,
  avatarUrl,
}: {
  template: Template;
  /** Только для type "comment" — чтобы показать превью выбранного поста. */
  media?: IgMedia[];
  username: string;
  usernameLoading?: boolean;
  avatarUrl?: string | null;
}) {
  const isDm = template.type === "dm";
  // Дефолт — "Директ", раз это конечный результат автоматизации (то, что
  // реально получит человек) — самое информативное состояние с первого
  // взгляда на статичной странице просмотра, где нет "шага 1 из 3",
  // задающего естественный порядок, как в визарде.
  const [step, setStep] = useState<PreviewStep>(2);

  const post = media?.find((m) => m.id === template.post_id);
  const links =
    template.link_button_text?.trim() && template.link_button_url?.trim()
      ? [{ text: template.link_button_text.trim(), url: template.link_button_url.trim() }]
      : (template.links ?? []);

  return (
    <PhonePreview
      step={isDm ? 2 : step}
      hideTabs={isDm}
      onTabClick={isDm ? undefined : setStep}
      username={username}
      usernameLoading={usernameLoading}
      avatarUrl={avatarUrl}
      post={
        post
          ? { thumbnailUrl: post.thumbnail_url || post.media_url }
          : null
      }
      isAnyPost={template.post_id === null}
      keyword={template.keyword ?? ""}
      keywordMode={template.keyword ? "specific" : "any"}
      dmText={template.dm_text}
      showReply
      replyText={template.template_replies?.[0]?.text ?? ""}
      incomingTriggerText={
        isDm ? (template.keyword?.split(",")[0].trim() ?? "Привет!") : undefined
      }
      requireFollowCheck={template.require_follow_check ?? false}
      buttonTextInitial={template.button_text_initial ?? ""}
      messageIfNotFollowing={template.message_if_not_following ?? ""}
      buttonTextFollowConfirm={template.button_text_follow_confirm ?? ""}
      messageAfterFollow={template.message_after_follow ?? ""}
      links={links}
    />
  );
}
