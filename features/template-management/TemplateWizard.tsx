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
import { Banner } from "@astryxdesign/core/Banner";
import {
  SegmentedControl,
  SegmentedControlItem,
} from "@astryxdesign/core/SegmentedControl";
import { createTemplate, updateTemplate } from "@/entities/template/api";
import { ApiError } from "@/shared/api/client";
import type { Template, TemplateInput } from "@/entities/template/types";
import type { IgMedia } from "@/entities/ig-account/types";
import { PostPicker } from "./PostPicker";
import { PhonePreview } from "./PhonePreview";
import {
  DM_MESSAGE_MAX_LENGTH,
  COMMENT_REPLY_MAX_LENGTH,
  dmMessageSchema,
  urlSchema,
  schemaError,
  commentReplyLengthError,
} from "./validation";

const DEFAULT_DM_TEXT =
  "Привет! Спасибо за комментарий 🙌 Вот то, что ты искал(а): [ССЫЛКА]";
const DEFAULT_REPLY_TEXT = "Спасибо! Ссылку отправил тебе в директ 🚀";
const DEFAULT_BUTTON_TEXT_INITIAL = "Получить";
const DEFAULT_BUTTON_TEXT_FOLLOW_CONFIRM = "Я подписался";
const DEFAULT_MESSAGE_IF_NOT_FOLLOWING =
  "Похоже, ты ещё не подписан(а). Подпишись и жми кнопку ниже 👇";
// Без "[ССЫЛКА]"-токена внутри текста — в отличие от DEFAULT_DM_TEXT выше,
// у финального сообщения теперь есть настоящая кнопка-ссылка под текстом
// (см. linkButtonText/linkButtonUrl), токен в самом тексте стал бы
// дублирующим и путающим.
const DEFAULT_MESSAGE_AFTER_FOLLOW = "Спасибо! Вот твоя ссылка ниже 👇";

/** У аккаунта может быть только ОДИН шаблон на "любой пост" — второй сделал
 * бы срабатывание неоднозначным (какой из двух ловит комментарий?). Правило
 * бланket: неважно, активен ли существующий и какое у него слово-триггер —
 * см. переписку по задаче, юзер осознанно упростил именно так, не хотим
 * заводить более тонкую логику (активен/неактивен, совпадает триггер или
 * нет) без реальной необходимости. Код ошибки — тот же на фронте и бэке,
 * см. промпт бэкенду в CLAUDE.md/переписке.
 */
const ANY_POST_CONFLICT_CODE = "any_post_template_exists";
const ANY_POST_CONFLICT_MESSAGE =
  "У этого аккаунта уже есть шаблон на «любой пост». Одновременно может " +
  "быть только один такой шаблон — отключите или удалите существующий, " +
  "чтобы создать новый.";

type WizardStep = 0 | 1 | 2 | 3;

type TemplateWizardProps = {
  igAccountId: string;
  username: string;
  usernameLoading?: boolean;
  avatarUrl?: string | null;
  media: IgMedia[];
  /** Уже загруженные шаблоны аккаунта (родитель их и так держит для списка
   * карточек) — нужны только для клиентской проверки "любой пост"-конфликта
   * (см. ANY_POST_CONFLICT_MESSAGE), без похода на бэкенд ради неё. */
  existingTemplates: Template[];
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
  existingTemplates,
  editingTemplate,
  onClose,
  onSaved,
}: TemplateWizardProps) {
  const [step, setStep] = useState<WizardStep>(0);
  // Форма и превью телефона на десктопе (≥1024px, стандартный и
  // единственный брейкпойнт в проекте — Tailwind lg:) всегда видны рядом.
  // Ниже 1024px рядом не помещаются — переключаются табом, см. рендер
  // ниже (SegmentedControl, видим только на мобилке через lg:hidden).
  const [mobileView, setMobileView] = useState<"form" | "preview">("form");
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
  // Кнопка-ссылка под финальным сообщением — своя опциональная секция,
  // независимая от requireFollowCheck-переключателя выше по смыслу (это
  // "как оформить последний шаг", а не "включена ли вообще проверка
  // подписки"). showLinkButton — чисто UI-состояние (сам факт "показывать
  // ли поля"), на бэкенд не уходит — при сохранении наличие кнопки
  // определяется по непустым linkButtonText/linkButtonUrl, тем же
  // паттерном, что и остальные button-поля в этом файле.
  const [showLinkButton, setShowLinkButton] = useState(
    Boolean(editingTemplate?.link_button_text || editingTemplate?.link_button_url),
  );
  const [linkButtonText, setLinkButtonText] = useState(
    editingTemplate?.link_button_text ?? "",
  );
  const [linkButtonUrl, setLinkButtonUrl] = useState(
    editingTemplate?.link_button_url ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  // Показывать ли per-field ошибки (status на TextInput/TextArea) — только
  // ПОСЛЕ первой попытки продвинуться дальше (Далее/таб/сабмит), не с
  // первого рендера пустого обязательного поля. Once true — остаётся true
  // до конца жизни визарда (стандартный паттерн "валидируй на первой
  // попытке сабмита, дальше — живьём по мере правок").
  const [hasAttempted, setHasAttempted] = useState(false);
  // Гонка: бэкенд отклонил по ANY_POST_CONFLICT_CODE, хотя локально
  // (по устаревшему existingTemplates) конфликта не видно — значит кто-то
  // создал конфликтующий шаблон между загрузкой страницы и этим сабмитом.
  // Отдельный флаг, а не просто stepError-текст: без него hasAnyPostConflict
  // ниже продолжил бы врать "конфликта нет" (существующий проп не
  // рефетчится), и юзер мог бы тут же повторить ту же ошибку.
  const [raceConflictDetected, setRaceConflictDetected] = useState(false);

  const selectedPost = media.find((m) => m.id === postId) ?? null;

  // Живая (не гейтится hasAttempted — это жёсткий блокер, не забытое
  // поле, показываем сразу при выборе "любой пост", см. переписку) проверка
  // конфликта: исключаем сам редактируемый шаблон (иначе редактирование
  // уже существующего any-post шаблона ложно конфликтовало бы само с
  // собой).
  const hasAnyPostConflict =
    scope === "any" &&
    (raceConflictDetected ||
      existingTemplates.some(
        (t) => t.post_id === null && t.id !== editingTemplate?.id,
      ));

  // Per-field ошибки для шага 3 — считаются на каждый рендер (дёшево,
  // визард не rerender-чувствителен), гейтятся hasAttempted (см. коммент
  // у стейта выше). Вынесены сюда, а не инлайн в JSX — JSX внутри
  // `{step === 3 && (...)}` не место для `const`.
  const dmTextError = hasAttempted ? schemaError(dmMessageSchema, dmText) : null;
  const messageIfNotFollowingError =
    hasAttempted && requireFollowCheck
      ? schemaError(dmMessageSchema, messageIfNotFollowing)
      : null;
  const messageAfterFollowError =
    hasAttempted && requireFollowCheck
      ? schemaError(dmMessageSchema, messageAfterFollow)
      : null;
  const linkButtonUrlError =
    hasAttempted && showLinkButton && linkButtonUrl.trim()
      ? schemaError(urlSchema, linkButtonUrl.trim())
      : null;

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

  // Валидация конкретного шага, вынесена из goNext() — переиспользуется и
  // кликом по табу под превью (goToStep), который может перепрыгнуть сразу
  // через несколько шагов и должен проверить каждый промежуточный, как
  // будто по нему последовательно жали "Далее". Шаг 3 не валидируется тут
  // — у него нет "следующего", это конец формы (там своя проверка в
  // handleSubmit).
  function validateStep(s: WizardStep): string | null {
    if (s === 0 && scope === "post" && !postId) {
      return "Выберите пост или переключитесь на «любой пост».";
    }
    // Текст конфликта уже виден живьём в Banner'е на шаге 0 (см.
    // hasAnyPostConflict) — тут короткая ДРУГАЯ формулировка, просто чтобы
    // блокировать переход, не дублируя слово в слово то, что уже написано
    // в баннере прямо над этой ошибкой.
    if (s === 0 && hasAnyPostConflict) {
      return "Нельзя продолжить, пока не решён конфликт шаблонов выше.";
    }
    if (s === 1 && keywordMode === "specific" && !keyword.trim()) {
      return "Введите хотя бы одно слово или выберите «любое слово».";
    }
    if (s === 2) {
      if (!replyTexts.some((t) => t.trim())) {
        return "Добавьте хотя бы один вариант ответа на комментарий.";
      }
      const tooLong = replyTexts.find((t) => commentReplyLengthError(t));
      if (tooLong) {
        return `Ответ на комментарий не длиннее ${COMMENT_REPLY_MAX_LENGTH} символов.`;
      }
    }
    return null;
  }

  function goNext() {
    setHasAttempted(true);
    setStepError(null);
    const error = validateStep(step);
    if (error) {
      setStepError(error);
      return;
    }
    if (step < 3) setStep((step + 1) as WizardStep);
  }

  function goBack() {
    setStepError(null);
    setStep((s) => (s === 0 ? 0 : ((s - 1) as WizardStep)));
  }

  /** Клик по табу "Пост/Комментарии/Директ" под превью — назад пускаем
   * свободно (шаг уже был пройден), вперёд — только через валидацию
   * каждого промежуточного шага по очереди, тем же способом, что и
   * повторными кликами по "Далее"; на первом же невалидном шаге
   * останавливаемся и показываем его ошибку, дальше не прыгаем. */
  function goToStep(target: WizardStep) {
    setHasAttempted(true);
    setStepError(null);
    if (target <= step) {
      setStep(target);
      return;
    }
    for (let s = step; s < target; s++) {
      const error = validateStep(s as WizardStep);
      if (error) {
        setStep(s as WizardStep);
        setStepError(error);
        return;
      }
    }
    setStep(target);
  }

  // Таб "Комментарии" под превью визуально накрывает ДВА шага формы (1 —
  // слово-триггер, 2 — ответ на комментарий, см. маппинг PreviewStep ниже
  // в <PhonePreview step={...}>) — клик по нему ведёт в НАЧАЛО этой группы
  // (шаг 1), а не в её середину.
  function handlePreviewTabClick(tab: 0 | 1 | 2) {
    goToStep((tab === 0 ? 0 : tab === 1 ? 1 : 3) as WizardStep);
  }

  async function handleSubmit() {
    setHasAttempted(true);

    const trimmedReplies = replyTexts.map((t) => t.trim()).filter(Boolean);
    if (trimmedReplies.length === 0) {
      setStepError("Добавьте хотя бы один вариант ответа на комментарий.");
      return;
    }
    const tooLongReply = replyTexts.find((t) => commentReplyLengthError(t));
    if (tooLongReply) {
      setStepError(
        `Ответ на комментарий не длиннее ${COMMENT_REPLY_MAX_LENGTH} символов.`,
      );
      return;
    }
    const dmTextError = schemaError(dmMessageSchema, dmText);
    if (dmTextError) {
      setStepError(dmTextError);
      return;
    }
    if (requireFollowCheck) {
      if (!buttonTextInitial.trim() || !buttonTextFollowConfirm.trim()) {
        setStepError(
          "Заполните все поля проверки подписки — они обязательны, если тумблер включён.",
        );
        return;
      }
      const ifNotError = schemaError(dmMessageSchema, messageIfNotFollowing);
      if (ifNotError) {
        setStepError(ifNotError);
        return;
      }
      const afterError = schemaError(dmMessageSchema, messageAfterFollow);
      if (afterError) {
        setStepError(afterError);
        return;
      }
    }
    if (showLinkButton) {
      if (!linkButtonText.trim()) {
        setStepError("Заполните текст кнопки-ссылки.");
        return;
      }
      const urlError = schemaError(urlSchema, linkButtonUrl.trim());
      if (urlError) {
        setStepError(urlError);
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
      linkButtonText: showLinkButton ? linkButtonText.trim() : "",
      linkButtonUrl: showLinkButton ? linkButtonUrl.trim() : "",
    };

    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, body);
      } else {
        await createTemplate(igAccountId, body);
      }
      onSaved();
    } catch (e) {
      // Подстраховка от гонки (два таба, création мимо визарда) — основной
      // путь уже закрыт клиентской проверкой (hasAnyPostConflict), сюда
      // должны попадать только эти редкие случаи. Код — see
      // ANY_POST_CONFLICT_CODE, бэкенд-контракт описан отдельным промптом.
      if (e instanceof ApiError && e.code === ANY_POST_CONFLICT_CODE) {
        setRaceConflictDetected(true);
        setStep(0);
        setStepError(null);
        return;
      }
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

      {/* Только мобилка (<1024px) — на десктопе форма и превью и так видны
          одновременно, переключатель там не нужен (lg:hidden). */}
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

              {/* Живой блокер, не гейтится hasAttempted — см. коммент у
                  hasAnyPostConflict выше: это жёсткое правило, а не
                  забытое поле, честнее показать сразу при выборе "любой
                  пост", не дожидаясь клика "Далее". */}
              {hasAnyPostConflict && (
                <Banner
                  status="error"
                  title="Такой шаблон уже есть"
                  description={ANY_POST_CONFLICT_MESSAGE}
                  className="mt-4"
                />
              )}

              {stepError && (
                <Text className="mt-4 text-error">{stepError}</Text>
              )}

              <Button
                width="100%"
                variant="primary"
                label="Далее"
                onClick={goNext}
                isDisabled={hasAnyPostConflict}
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
                  {replyTexts.map((text, i) => {
                    const lengthError = hasAttempted
                      ? commentReplyLengthError(text)
                      : null;
                    return (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex-1">
                        <TextInput
                          label={`Вариант ответа ${i + 1}`}
                          isLabelHidden
                          value={text}
                          onChange={(value) => updateReplyText(i, value)}
                          description={`До ${COMMENT_REPLY_MAX_LENGTH} символов`}
                          status={
                            lengthError
                              ? { type: "error", message: lengthError }
                              : undefined
                          }
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
                    );
                  })}
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
                  maxLength={DM_MESSAGE_MAX_LENGTH}
                  description="Обязательное поле — отправляется в директ подписчику"
                  status={
                    dmTextError
                      ? { type: "error", message: dmTextError }
                      : undefined
                  }
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
                      maxLength={DM_MESSAGE_MAX_LENGTH}
                      placeholder="Похоже, ты ещё не подписан(а). Подпишись и жми кнопку ниже 👇"
                      status={
                        messageIfNotFollowingError
                          ? { type: "error", message: messageIfNotFollowingError }
                          : undefined
                      }
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
                      maxLength={DM_MESSAGE_MAX_LENGTH}
                      placeholder="Спасибо! Вот твоя ссылка ниже 👇"
                      status={
                        messageAfterFollowError
                          ? { type: "error", message: messageAfterFollowError }
                          : undefined
                      }
                    />

                    {/* Кнопка-ссылка — своя опциональная секция, не завязана
                        жёстко на "финальное сообщение обязано её иметь":
                        не каждый юзер хочет вести на внешний урл именно тут. */}
                    <Switch
                      label="Добавить кнопку со ссылкой"
                      description="Откроет указанный урл — в отличие от кнопок выше, не отправляет следующее сообщение"
                      value={showLinkButton}
                      onChange={(checked) => setShowLinkButton(checked)}
                      labelSpacing="spread"
                    />
                    {showLinkButton && (
                      <Stack gap={3} className="border-t border-border pt-3">
                        <TextInput
                          label="Текст кнопки"
                          value={linkButtonText}
                          onChange={(value) => setLinkButtonText(value)}
                          placeholder="Смотреть уроки"
                        />
                        <TextInput
                          label="Ссылка"
                          value={linkButtonUrl}
                          onChange={(value) => setLinkButtonUrl(value)}
                          placeholder="https://..."
                          status={
                            linkButtonUrlError
                              ? { type: "error", message: linkButtonUrlError }
                              : undefined
                          }
                        />
                      </Stack>
                    )}
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

        <div
          className={`${
            mobileView === "form" ? "hidden" : "flex"
          } flex-1 items-center justify-center overflow-hidden bg-body p-10 lg:flex`}
        >
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
            linkButtonText={showLinkButton ? linkButtonText : ""}
            linkButtonUrl={showLinkButton ? linkButtonUrl : ""}
            onTabClick={handlePreviewTabClick}
          />
        </div>
      </div>
    </div>
  );
}
