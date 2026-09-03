"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Stack } from "@astryxdesign/core/Stack";
import { Heading } from "@astryxdesign/core/Heading";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Link } from "@astryxdesign/core/Link";
import { Card } from "@astryxdesign/core/Card";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import { Switch } from "@astryxdesign/core/Switch";
import { createTemplate, updateTemplate } from "@/entities/template/api";
import type { Template, TemplateInput } from "@/entities/template/types";
import type { IgMedia } from "@/entities/ig-account/types";
import { PostPicker } from "./PostPicker";
import { PhonePreview } from "./PhonePreview";

const DEFAULT_DM_TEXT =
  "Привет! Спасибо за комментарий 🙌 Вот то, что ты искал(а): [ССЫЛКА]";
const DEFAULT_REPLY_TEXT = "Спасибо! Ссылку отправил тебе в директ 🚀";
const DEFAULT_BUTTON_TEXT_INITIAL = "Получить";
const DEFAULT_BUTTON_TEXT_FOLLOW_CONFIRM = "Я подписался";

type WizardStep = 0 | 1 | 2 | 3;

type TemplateWizardProps = {
  igAccountId: string;
  username: string;
  usernameLoading?: boolean;
  avatarUrl?: string | null;
  media: IgMedia[];
  editingTemplate: Template | null;
  onClose: () => void;
  onSaved: () => void;
};

export function TemplateWizard({
  igAccountId,
  username,
  usernameLoading = false,
  avatarUrl = null,
  media,
  editingTemplate,
  onClose,
  onSaved,
}: TemplateWizardProps) {
  const [step, setStep] = useState<WizardStep>(0);
  const [scope, setScope] = useState<"post" | "any">(
    editingTemplate?.post_id ? "post" : "any",
  );
  const [postId, setPostId] = useState<string | null>(
    editingTemplate?.post_id ?? null,
  );
  const [keywordMode, setKeywordMode] = useState<"specific" | "any">(
    editingTemplate?.keyword ? "specific" : "any",
  );
  const [keyword, setKeyword] = useState(editingTemplate?.keyword ?? "");
  const [dmText, setDmText] = useState(
    editingTemplate?.dm_text ?? DEFAULT_DM_TEXT,
  );
  const [replyTexts, setReplyTexts] = useState<string[]>(
    editingTemplate?.template_replies?.length
      ? editingTemplate.template_replies.map((r) => r.text)
      : [DEFAULT_REPLY_TEXT],
  );
  const [requireFollowCheck, setRequireFollowCheck] = useState(
    editingTemplate?.require_follow_check ?? false,
  );
  const [buttonTextInitial, setButtonTextInitial] = useState(
    editingTemplate?.button_text_initial || DEFAULT_BUTTON_TEXT_INITIAL,
  );
  const [messageIfNotFollowing, setMessageIfNotFollowing] = useState(
    editingTemplate?.message_if_not_following ?? "",
  );
  const [buttonTextFollowConfirm, setButtonTextFollowConfirm] = useState(
    editingTemplate?.button_text_follow_confirm ||
      DEFAULT_BUTTON_TEXT_FOLLOW_CONFIRM,
  );
  const [messageAfterFollow, setMessageAfterFollow] = useState(
    editingTemplate?.message_after_follow ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  const selectedPost = media.find((m) => m.id === postId) ?? null;

  function updateReplyText(index: number, value: string) {
    setReplyTexts((texts) => {
      const next = [...texts];
      next[index] = value;
      return next;
    });
  }

  function addReplyVariant() {
    setReplyTexts((texts) => [...texts, ""]);
  }

  function removeReplyVariant(index: number) {
    setReplyTexts((texts) => texts.filter((_, i) => i !== index));
  }

  function goNext() {
    setStepError(null);
    if (step === 0) {
      if (scope === "post" && !postId) {
        setStepError("Выберите пост или переключитесь на «любой пост».");
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      if (keywordMode === "specific" && !keyword.trim()) {
        setStepError("Введите хотя бы одно слово или выберите «любое слово».");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      const hasReply = replyTexts.some((t) => t.trim());
      if (!hasReply) {
        setStepError("Добавьте хотя бы один вариант ответа на комментарий.");
        return;
      }
      setStep(3);
    }
  }

  function goBack() {
    setStepError(null);
    setStep((s) => (s === 0 ? 0 : ((s - 1) as WizardStep)));
  }

  async function handleSubmit() {
    const trimmedReplies = replyTexts.map((t) => t.trim()).filter(Boolean);
    if (trimmedReplies.length === 0) {
      setStepError("Добавьте хотя бы один вариант ответа на комментарий.");
      return;
    }
    if (!dmText.trim()) {
      setStepError("Текст приветственного DM не может быть пустым.");
      return;
    }
    if (requireFollowCheck) {
      if (
        !buttonTextInitial.trim() ||
        !messageIfNotFollowing.trim() ||
        !buttonTextFollowConfirm.trim() ||
        !messageAfterFollow.trim()
      ) {
        setStepError(
          "Заполните все поля проверки подписки — они обязательны, если тумблер включён.",
        );
        return;
      }
    }

    setSaving(true);
    setStepError(null);

    const body: TemplateInput = {
      postId: scope === "any" ? null : postId,
      keyword: keywordMode === "any" ? null : keyword.trim() || null,
      dmText: dmText.trim(),
      replyTexts: trimmedReplies,
      requireFollowCheck,
      buttonTextInitial: requireFollowCheck ? buttonTextInitial.trim() : "",
      messageIfNotFollowing: requireFollowCheck
        ? messageIfNotFollowing.trim()
        : "",
      buttonTextFollowConfirm: requireFollowCheck
        ? buttonTextFollowConfirm.trim()
        : "",
      messageAfterFollow: requireFollowCheck ? messageAfterFollow.trim() : "",
    };

    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, body);
      } else {
        await createTemplate(igAccountId, body);
      }
      onSaved();
    } catch (e) {
      setStepError(
        e instanceof Error ? e.message : "Не получилось сохранить шаблон.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-surface">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Link onClick={onClose}>← Отмена</Link>
        <Text color="secondary" type="supporting">
          Шаг {step + 1} из 4
        </Text>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-full max-w-[420px] shrink-0 overflow-y-auto px-6 py-8 lg:border-r lg:border-border lg:px-8">
          {step === 0 && (
            <>
              <Heading level={2} className="mb-1 text-lg font-medium">
                Когда кто-то комментирует
              </Heading>
              <Text color="secondary" className="mb-6">
                Выберите, на какие посты будет реагировать бот.
              </Text>

              <PostPicker
                media={media}
                scope={scope}
                selectedPostId={postId}
                onScopeChange={(s) => {
                  setScope(s);
                  setStepError(null);
                }}
                onSelectPost={(id) => {
                  setPostId(id);
                  setStepError(null);
                }}
              />

              {stepError && (
                <Text className="mt-4 text-error">{stepError}</Text>
              )}

              <Button
                width="100%"
                variant="primary"
                label="Далее"
                onClick={goNext}
                className="mt-6"
              />
            </>
          )}

          {step === 1 && (
            <>
              <Link onClick={goBack}>← Назад</Link>
              <Heading level={2} className="mb-1 mt-4 text-lg font-medium">
                И этот комментарий содержит
              </Heading>
              <Text color="secondary" className="mb-6">
                Слово-триггер, чтобы бот отвечал только на нужные комментарии.
              </Text>

              <RadioList
                label="Слово-триггер"
                isLabelHidden
                value={keywordMode}
                onChange={(v) => setKeywordMode(v as "specific" | "any")}
              >
                <RadioListItem
                  label="определённое слово или слова"
                  value="specific"
                />
                <RadioListItem label="любое слово" value="any" />
              </RadioList>

              {keywordMode === "specific" && (
                <div className="mt-3">
                  <TextInput
                    label="Слово-триггер"
                    isLabelHidden
                    value={keyword}
                    onChange={(value) => setKeyword(value)}
                    placeholder="например: цена, стоимость"
                    description="Через запятую, если вариантов несколько"
                  />
                </div>
              )}

              {stepError && (
                <Text className="mt-4 text-error">{stepError}</Text>
              )}

              <Button
                width="100%"
                variant="primary"
                label="Далее"
                onClick={goNext}
                className="mt-6"
              />
            </>
          )}

          {step === 2 && (
            <>
              <Link onClick={goBack}>← Назад</Link>
              <Heading level={2} className="mb-1 mt-4 text-lg font-medium">
                Ответ на комментарий
              </Heading>
              <Text color="secondary" className="mb-6">
                Если вариантов несколько — бот выберет случайный, чтобы ответы
                не выглядели одинаково под разными комментариями.
              </Text>

              <Card padding={4}>
                <Text weight="medium" className="mb-3">
                  варианты ответа
                </Text>
                <Stack gap={2}>
                  {replyTexts.map((text, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex-1">
                        <TextInput
                          label={`Вариант ответа ${i + 1}`}
                          isLabelHidden
                          value={text}
                          onChange={(value) => updateReplyText(i, value)}
                        />
                      </div>
                      {replyTexts.length > 1 && (
                        <IconButton
                          label="Удалить вариант"
                          icon={<X size={16} />}
                          variant="ghost"
                          onClick={() => removeReplyVariant(i)}
                        />
                      )}
                    </div>
                  ))}
                </Stack>
                <div className="mt-2">
                  <Link onClick={addReplyVariant}>+ добавить вариант</Link>
                </div>
              </Card>

              {stepError && (
                <Text className="mt-4 text-error">{stepError}</Text>
              )}

              <Button
                width="100%"
                variant="primary"
                label="Далее"
                onClick={goNext}
                className="mt-6"
              />
            </>
          )}

          {step === 3 && (
            <>
              <Link onClick={goBack}>← Назад</Link>
              <Heading level={2} className="mb-1 mt-4 text-lg font-medium">
                Они получат
              </Heading>
              <Text color="secondary" className="mb-6">
                Настройте сообщение, которое бот пришлёт в директ.
              </Text>

              <Card padding={4}>
                {/* Тумблер намеренно не интерактивен: dmText — обязательное
                    поле бэкенда, полноценно выключить приветственное DM
                    сейчас нельзя. Заблокированный Switch честно об этом
                    сообщает, а не притворяется рабочим переключателем. */}
                <Switch
                  label="приветственное DM"
                  value={true}
                  isDisabled
                  disabledMessage="Обязательное поле — пока не может быть отключено"
                  labelSpacing="spread"
                  className="mb-3"
                />
                <TextArea
                  label={
                    requireFollowCheck
                      ? "Открывающее сообщение"
                      : "Текст сообщения"
                  }
                  value={dmText}
                  onChange={(value) => setDmText(value)}
                  rows={4}
                  description="Обязательное поле — отправляется в директ подписчику"
                />
              </Card>

              <Card padding={4} className="mt-4">
                <Switch
                  label="Проверять подписку перед выдачей"
                  description="Бот попросит подписаться, прежде чем прислать материал"
                  value={requireFollowCheck}
                  onChange={(checked) => setRequireFollowCheck(checked)}
                  labelSpacing="spread"
                />

                {requireFollowCheck && (
                  <Stack gap={4} className="mt-4 border-t border-border pt-4">
                    <TextInput
                      label="Текст кнопки в открывающем сообщении"
                      value={buttonTextInitial}
                      onChange={(value) => setButtonTextInitial(value)}
                    />
                    <TextArea
                      label="Сообщение, если подписки нет"
                      value={messageIfNotFollowing}
                      onChange={(value) => setMessageIfNotFollowing(value)}
                      rows={3}
                      placeholder="Похоже, ты ещё не подписан(а). Подпишись и жми кнопку ниже 👇"
                    />
                    <TextInput
                      label="Текст кнопки «Я подписался»"
                      value={buttonTextFollowConfirm}
                      onChange={(value) => setButtonTextFollowConfirm(value)}
                    />
                    <TextArea
                      label="Финальное сообщение"
                      value={messageAfterFollow}
                      onChange={(value) => setMessageAfterFollow(value)}
                      rows={3}
                      placeholder="Спасибо! Вот твоя ссылка: [ССЫЛКА]"
                    />
                  </Stack>
                )}
              </Card>

              {stepError && (
                <Text className="mt-4 text-error">{stepError}</Text>
              )}

              <Button
                width="100%"
                variant="primary"
                isLoading={saving}
                label={
                  saving
                    ? "Сохраняем…"
                    : editingTemplate
                      ? "Сохранить изменения"
                      : "Создать шаблон"
                }
                onClick={handleSubmit}
                className="mt-6"
              />
            </>
          )}
        </div>

        <div className="hidden flex-1 items-center justify-center overflow-hidden bg-body p-10 lg:flex">
          <PhonePreview
            step={step === 0 ? 0 : step === 3 ? 2 : 1}
            username={username}
            usernameLoading={usernameLoading}
            avatarUrl={avatarUrl}
            post={
              selectedPost
                ? {
                    thumbnailUrl:
                      selectedPost.thumbnail_url || selectedPost.media_url,
                  }
                : null
            }
            isAnyPost={scope === "any"}
            keyword={keyword}
            keywordMode={keywordMode}
            dmText={dmText}
            showReply={step === 2}
            replyText={replyTexts.find((t) => t.trim())?.trim() ?? ""}
            requireFollowCheck={requireFollowCheck}
            buttonTextInitial={buttonTextInitial}
            messageIfNotFollowing={messageIfNotFollowing}
            buttonTextFollowConfirm={buttonTextFollowConfirm}
            messageAfterFollow={messageAfterFollow}
          />
        </div>
      </div>
    </div>
  );
}
