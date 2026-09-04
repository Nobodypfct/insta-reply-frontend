"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
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
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { Tokenizer } from "@astryxdesign/core/Tokenizer";
import type { SearchableItem } from "@astryxdesign/core/Typeahead";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@astryxdesign/core/SegmentedControl";
import { createTemplate, updateTemplate } from "@/entities/template/api";
import type { Template, DmTemplateInput, TemplateLink } from "@/entities/template/types";
import { PhonePreview } from "./PhonePreview";
import { FollowCheckFields } from "./FollowCheckFields";
import {
  DEFAULT_KEYWORD_TAG,
  emptyKeywordSource,
  keywordStringToTags,
  keywordTagsToString,
} from "./keywordTags";
import {
  DM_MESSAGE_MAX_LENGTH,
  dmMessageSchema,
  urlSchema,
  schemaError,
} from "./validation";

const DEFAULT_DM_TEXT = "Привет! Спасибо, что написал(а) 🙌";
const DEFAULT_BUTTON_TEXT_INITIAL = "Получить";
const DEFAULT_BUTTON_TEXT_FOLLOW_CONFIRM = "Я подписался";
const DEFAULT_MESSAGE_IF_NOT_FOLLOWING =
  "Похоже, ты ещё не подписан(а). Подпишись и жми кнопку ниже 👇";
const DEFAULT_MESSAGE_AFTER_FOLLOW = "Спасибо! Вот твоя ссылка ниже 👇";
// Настоящее поле (не forward-compatible заглушка — см. entities/template/
// types.ts), дефолт для НОВОГО шаблона всё же заполнен примером, тот же
// принцип, что и у CommentTemplateWizard.
const DEFAULT_TEMPLATE_NAME = "Ответ в директ";

type DmTemplateWizardProps = {
  igAccountId: string;
  username: string;
  usernameLoading?: boolean;
  avatarUrl?: string | null;
  editingTemplate: Template | null;
  onClose: () => void;
  onSaved: () => void;
};

/**
 * Визард DM→DM — генуинно другой флоу от CommentTemplateWizard (см.
 * entities/template/types.ts "План: типы автоматизаций"): триггер —
 * входящее сообщение в директ, не пост/комментарий вообще, поэтому у
 * него нет ни PostPicker'а, ни вариантов ответа НА КОММЕНТАРИЙ
 * (template_replies) — только слово-триггер + ответное DM-сообщение.
 *
 * ОДНОСТРАНИЧНАЯ форма, не многошаговый визард — в отличие от
 * CommentTemplateWizard (3 шага), тут по сути одно решение "триггер +
 * ответ", степпер только усложнил бы то, что помещается на один экран
 * (см. референс-скриншот конкурента, тоже одна страница).
 */
export function DmTemplateWizard({
  igAccountId,
  username,
  usernameLoading = false,
  avatarUrl = null,
  editingTemplate,
  onClose,
  onSaved,
}: DmTemplateWizardProps) {
  const [mobileView, setMobileView] = useState<"form" | "preview">("form");
  const [name, setName] = useState(
    editingTemplate?.name || DEFAULT_TEMPLATE_NAME,
  );
  const [keywordMode, setKeywordMode] = useState<"specific" | "any">(
    editingTemplate?.keyword ? "specific" : "any",
  );
  const [keywordTags, setKeywordTags] = useState<SearchableItem[]>(() =>
    editingTemplate
      ? keywordStringToTags(editingTemplate.keyword)
      : [DEFAULT_KEYWORD_TAG],
  );
  const [exactMatch, setExactMatch] = useState(
    editingTemplate?.exact_match ?? false,
  );
  const [dmText, setDmText] = useState(
    editingTemplate?.dm_text ?? DEFAULT_DM_TEXT,
  );
  // "+ Add A Link" — повторяемый список ссылок под ответным сообщением
  // (НЕ одна кнопка, как у CommentTemplateWizard — см. TemplateLink в
  // entities/template/types.ts). Пусто по умолчанию — в отличие от
  // остальных полей формы, ни одна ссылка не является чем-то, что стоит
  // навязывать примером: правильный URL никогда не угадать за юзера (тот
  // же принцип, что уже применялся к linkButtonUrl раньше).
  const [links, setLinks] = useState<TemplateLink[]>(
    editingTemplate?.links?.length ? editingTemplate.links : [],
  );
  // "Automatically ask for a follow to build your audience" (см.
  // референс-скриншот) — переиспользуем УЖЕ существующую механику
  // requireFollowCheck (см. FollowCheckFields.tsx) как настоящий рабочий
  // тумблер, не заглушку/"UPGRADE"-лок: она у нас реально готова, нет
  // причины не дать ей работать и для DM-триггера. Второй пункт со
  // скриншота ("Follow up to re-engage") НЕ реализован — требует
  // планировщика отложенных сообщений на бэкенде, которого у нас нигде
  // нет, не тривиальное новое поле — см. CLAUDE.md.
  const [requireFollowCheck, setRequireFollowCheck] = useState(
    editingTemplate?.require_follow_check ?? false,
  );
  const [buttonTextInitial, setButtonTextInitial] = useState(
    editingTemplate?.button_text_initial || DEFAULT_BUTTON_TEXT_INITIAL,
  );
  const [messageIfNotFollowing, setMessageIfNotFollowing] = useState(
    editingTemplate?.message_if_not_following ||
      DEFAULT_MESSAGE_IF_NOT_FOLLOWING,
  );
  const [buttonTextFollowConfirm, setButtonTextFollowConfirm] = useState(
    editingTemplate?.button_text_follow_confirm ||
      DEFAULT_BUTTON_TEXT_FOLLOW_CONFIRM,
  );
  const [messageAfterFollow, setMessageAfterFollow] = useState(
    editingTemplate?.message_after_follow || DEFAULT_MESSAGE_AFTER_FOLLOW,
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);

  const dmTextError = hasAttempted ? schemaError(dmMessageSchema, dmText) : null;
  const messageIfNotFollowingError =
    hasAttempted && requireFollowCheck
      ? schemaError(dmMessageSchema, messageIfNotFollowing)
      : null;
  const messageAfterFollowError =
    hasAttempted && requireFollowCheck
      ? schemaError(dmMessageSchema, messageAfterFollow)
      : null;

  function updateLink(index: number, patch: Partial<TemplateLink>) {
    setLinks((prev) =>
      prev.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    );
  }
  function addLink() {
    setLinks((prev) => [...prev, { text: "", url: "" }]);
  }
  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  // Превью показывает только полностью заполненные ссылки (то же
  // решение, что раньше применялось к одиночной linkButton — недописанная
  // ссылка на середине ввода не должна мелькать в мокапе телефона).
  const filledLinks = links.filter((l) => l.text.trim() && l.url.trim());

  // Показанное в превью "входящее сообщение клиента" — первое слово-
  // триггер, если задано конкретное слово, иначе нейтральный пример (тот
  // же приём, что commentText в PhonePreview.tsx для comment-флоу).
  const incomingTriggerText =
    keywordMode === "specific" && keywordTags.length
      ? keywordTagsToString(keywordTags).split(",")[0].trim()
      : "Привет!";

  async function handleSubmit() {
    setHasAttempted(true);
    setFormError(null);

    if (!name.trim()) {
      setFormError("Введите название шаблона.");
      return;
    }
    if (keywordMode === "specific" && keywordTags.length === 0) {
      setFormError("Добавьте хотя бы одно слово или выберите «любое слово».");
      return;
    }
    const dmError = schemaError(dmMessageSchema, dmText);
    if (dmError) {
      setFormError(dmError);
      return;
    }
    // Ссылка легитимно может быть недописанной ТОЛЬКО если её вообще
    // убрали (removeLink) — раз юзер её оставил в списке, оба поля
    // обязательны, иначе получилась бы кнопка без текста или без адреса.
    for (const link of links) {
      if (!link.text.trim() || !link.url.trim()) {
        setFormError("Заполните текст и адрес у каждой добавленной ссылки.");
        return;
      }
      const urlError = schemaError(urlSchema, link.url.trim());
      if (urlError) {
        setFormError(urlError);
        return;
      }
    }
    if (requireFollowCheck) {
      if (!buttonTextInitial.trim() || !buttonTextFollowConfirm.trim()) {
        setFormError(
          "Заполните все поля проверки подписки — они обязательны, если тумблер включён.",
        );
        return;
      }
      const ifNotError = schemaError(dmMessageSchema, messageIfNotFollowing);
      if (ifNotError) {
        setFormError(ifNotError);
        return;
      }
      const afterError = schemaError(dmMessageSchema, messageAfterFollow);
      if (afterError) {
        setFormError(afterError);
        return;
      }
    }

    setSaving(true);

    const body: DmTemplateInput = {
      type: "dm",
      name: name.trim(),
      keyword:
        keywordMode === "any"
          ? null
          : keywordTagsToString(keywordTags).trim() || null,
      exactMatch,
      dmText: dmText.trim(),
      links: links.map((l) => ({ text: l.text.trim(), url: l.url.trim() })),
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
      setFormError(
        e instanceof Error ? e.message : "Не получилось сохранить шаблон.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    // Тот же переход от fixed-оверлея к обычному контенту роута, что и у
    // CommentTemplateWizard — см. комментарий там.
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Link onClick={onClose}>← Отмена</Link>
        <Text color="secondary" type="supporting">
          Ответ на директ
        </Text>
      </header>

      {/* Тот же lg:hidden-паттерн, что у CommentTemplateWizard — форма и
          превью рядом на десктопе, тумблер только на мобилке. */}
      <div className="border-b border-border px-6 py-3 lg:hidden">
        <SegmentedControl
          label="Показать форму или превью"
          value={mobileView}
          onChange={(v) => setMobileView(v as "form" | "preview")}
          layout="fill"
        >
          <SegmentedControlItem value="form" label="Форма" />
          <SegmentedControlItem value="preview" label="Превью" />
        </SegmentedControl>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div
          className={`${
            mobileView === "preview" ? "hidden" : "block"
          } w-full max-w-[420px] shrink-0 overflow-y-auto px-6 py-8 lg:block lg:border-r lg:border-border lg:px-8`}
        >
          <TextInput
            label="Название шаблона"
            value={name}
            onChange={(value) => setName(value)}
            className="mb-6"
          />

          <Heading level={2} className="mb-1 text-lg font-medium">
            Когда вам пишут в директ
          </Heading>
          <Text color="secondary" className="mb-6">
            Выберите, на какие входящие сообщения будет реагировать бот.
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
            <div className="mt-4">
              <Tokenizer
                label="Слово-триггер"
                isLabelHidden
                searchSource={emptyKeywordSource}
                value={keywordTags}
                onChange={(items) => setKeywordTags(items)}
                hasCreate
                placeholder="например: цена, стоимость"
                description="Enter или запятая — добавить слово"
              />
              <CheckboxInput
                label="Точное совпадение"
                description="Сообщение должно содержать слово/фразу целиком, а не как часть другого слова."
                value={exactMatch}
                onChange={(checked) => setExactMatch(checked)}
                className="mt-3"
              />
            </div>
          )}

          <Heading level={2} className="mb-1 mt-8 text-lg font-medium">
            Они получат от вас ответ
          </Heading>
          <Text color="secondary" className="mb-6">
            Настройте сообщение, которое бот пришлёт в ответ.
          </Text>

          <Card padding={4}>
            <TextArea
              label="Текст сообщения"
              value={dmText}
              onChange={(value) => setDmText(value)}
              rows={4}
              maxLength={DM_MESSAGE_MAX_LENGTH}
              description="Обязательное поле — отправляется в ответ на входящее сообщение"
              status={
                dmTextError ? { type: "error", message: dmTextError } : undefined
              }
            />

            {/* "+ Add A Link" с референса — повторяемый список, не одна
                кнопка (см. комментарий у useState(links) выше). */}
            <Stack gap={2} className="mt-4">
              {links.map((link, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <TextInput
                      label={`Текст ссылки ${i + 1}`}
                      isLabelHidden
                      value={link.text}
                      onChange={(value) => updateLink(i, { text: value })}
                      placeholder="Смотреть уроки"
                    />
                    <TextInput
                      label={`Адрес ссылки ${i + 1}`}
                      isLabelHidden
                      value={link.url}
                      onChange={(value) => updateLink(i, { url: value })}
                      placeholder="https://..."
                    />
                  </div>
                  <IconButton
                    label="Удалить ссылку"
                    icon={<X size={16} />}
                    variant="ghost"
                    onClick={() => removeLink(i)}
                  />
                </div>
              ))}
              <Button
                variant="secondary"
                label="Добавить ссылку"
                icon={<Plus size={16} />}
                onClick={addLink}
              />
            </Stack>
          </Card>

          <Card padding={4} className="mt-4">
            <FollowCheckFields
              requireFollowCheck={requireFollowCheck}
              onRequireFollowCheckChange={setRequireFollowCheck}
              buttonTextInitial={buttonTextInitial}
              onButtonTextInitialChange={setButtonTextInitial}
              messageIfNotFollowing={messageIfNotFollowing}
              onMessageIfNotFollowingChange={setMessageIfNotFollowing}
              messageIfNotFollowingError={messageIfNotFollowingError}
              buttonTextFollowConfirm={buttonTextFollowConfirm}
              onButtonTextFollowConfirmChange={setButtonTextFollowConfirm}
              messageAfterFollow={messageAfterFollow}
              onMessageAfterFollowChange={setMessageAfterFollow}
              messageAfterFollowError={messageAfterFollowError}
            />
          </Card>

          {formError && (
            <Text className="mt-4 text-error">{formError}</Text>
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
        </div>

        <div
          className={`${
            mobileView === "form" ? "hidden" : "flex"
          } flex-1 items-center justify-center overflow-hidden bg-body p-10 lg:flex`}
        >
          {/* step={2} всегда (Директ) + hideTabs — единственный экран
              превью у этого визарда, переключать нечего (см. Q5
              переписки). incomingTriggerText — реальное "входящее
              сообщение" клиента, показывается ПЕРЕД ответом бота. */}
          <PhonePreview
            step={2}
            hideTabs
            username={username}
            usernameLoading={usernameLoading}
            avatarUrl={avatarUrl}
            post={null}
            isAnyPost={false}
            keyword={keywordTagsToString(keywordTags)}
            keywordMode={keywordMode}
            dmText={dmText}
            showReply={false}
            replyText=""
            incomingTriggerText={incomingTriggerText}
            requireFollowCheck={requireFollowCheck}
            buttonTextInitial={buttonTextInitial}
            messageIfNotFollowing={messageIfNotFollowing}
            buttonTextFollowConfirm={buttonTextFollowConfirm}
            messageAfterFollow={messageAfterFollow}
            links={filledLinks}
          />
        </div>
      </div>
    </div>
  );
}
