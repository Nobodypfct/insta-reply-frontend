"use client";

import { useState } from "react";
import { createTemplate, updateTemplate } from "@/entities/template/api";
import type { Template, TemplateInput } from "@/entities/template/types";
import type { IgMedia } from "@/entities/ig-account/types";
import { PostPicker } from "./PostPicker";
import { PhonePreview } from "./PhonePreview";

const DEFAULT_DM_TEXT =
  "Привет! Спасибо за комментарий 🙌 Вот то, что ты искал(а): [ССЫЛКА]";
const DEFAULT_REPLY_TEXT = "Спасибо! Ссылку отправил тебе в директ 🚀";

type TemplateWizardProps = {
  igAccountId: string;
  username: string;
  media: IgMedia[];
  editingTemplate: Template | null;
  onClose: () => void;
  onSaved: () => void;
};

export function TemplateWizard({
  igAccountId,
  username,
  media,
  editingTemplate,
  onClose,
  onSaved,
}: TemplateWizardProps) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
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
    }
  }

  function goBack() {
    setStepError(null);
    setStep((s) => (s === 0 ? 0 : ((s - 1) as 0 | 1)));
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

    setSaving(true);
    setStepError(null);

    const body: TemplateInput = {
      postId: scope === "any" ? null : postId,
      keyword: keywordMode === "any" ? null : keyword.trim() || null,
      dmText: dmText.trim(),
      replyTexts: trimmedReplies,
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
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0B0F14]">
      <header className="flex items-center justify-between border-b border-[#141B24] px-6 py-4">
        <button
          onClick={onClose}
          className="text-sm text-[#7C8A9C] transition-colors hover:text-[#E7ECF2]"
        >
          ← Отмена
        </button>
        <p className="text-xs text-[#7C8A9C]">Шаг {step + 1} из 3</p>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-full max-w-[420px] shrink-0 overflow-y-auto px-6 py-8 lg:border-r lg:border-[#141B24] lg:px-8">
          {step === 0 && (
            <>
              <h2 className="mb-1 text-xl font-semibold text-[#E7ECF2]">
                Когда кто-то комментирует
              </h2>
              <p className="mb-6 text-sm text-[#7C8A9C]">
                Выберите, на какие посты будет реагировать бот.
              </p>

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
                <p className="mt-4 text-sm text-[#F87171]">{stepError}</p>
              )}

              <button
                onClick={goNext}
                className="mt-6 w-full rounded-lg bg-[#4F7CFF] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3D68EA]"
              >
                Далее
              </button>
            </>
          )}

          {step === 1 && (
            <>
              <button
                onClick={goBack}
                className="mb-4 text-xs text-[#7C8A9C] transition-colors hover:text-[#E7ECF2]"
              >
                ← Назад
              </button>
              <h2 className="mb-1 text-xl font-semibold text-[#E7ECF2]">
                И этот комментарий содержит
              </h2>
              <p className="mb-6 text-sm text-[#7C8A9C]">
                Слово-триггер, чтобы бот отвечал только на нужные комментарии.
              </p>

              <div className="space-y-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#232D3A] bg-[#141B24] p-4">
                  <input
                    type="radio"
                    checked={keywordMode === "specific"}
                    onChange={() => setKeywordMode("specific")}
                    className="mt-0.5 accent-[#4F7CFF]"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#E7ECF2]">
                      определённое слово или слова
                    </p>
                    {keywordMode === "specific" && (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={keyword}
                          onChange={(e) => setKeyword(e.target.value)}
                          placeholder="например: цена, стоимость"
                          className="w-full rounded-lg border border-[#232D3A] bg-[#0B0F14] px-3.5 py-2.5 text-sm text-[#E7ECF2] outline-none transition-colors focus:border-[#4F7CFF]"
                        />
                        <p className="mt-1.5 text-xs text-[#7C8A9C]">
                          Через запятую, если вариантов несколько
                        </p>
                      </div>
                    )}
                  </div>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#232D3A] bg-[#141B24] p-4">
                  <input
                    type="radio"
                    checked={keywordMode === "any"}
                    onChange={() => setKeywordMode("any")}
                    className="accent-[#4F7CFF]"
                  />
                  <p className="text-sm font-medium text-[#E7ECF2]">
                    любое слово
                  </p>
                </label>
              </div>

              {stepError && (
                <p className="mt-4 text-sm text-[#F87171]">{stepError}</p>
              )}

              <button
                onClick={goNext}
                className="mt-6 w-full rounded-lg bg-[#4F7CFF] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3D68EA]"
              >
                Далее
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                onClick={goBack}
                className="mb-4 text-xs text-[#7C8A9C] transition-colors hover:text-[#E7ECF2]"
              >
                ← Назад
              </button>
              <h2 className="mb-1 text-xl font-semibold text-[#E7ECF2]">
                Они получат
              </h2>
              <p className="mb-6 text-sm text-[#7C8A9C]">
                Настройте, что бот ответит под комментарием и что пришлёт в
                директ.
              </p>

              <div className="mb-4 rounded-xl border border-[#232D3A] bg-[#141B24] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-[#E7ECF2]">
                    приветственное DM
                  </p>
                  <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-[#4F7CFF]">
                    <span className="inline-block h-4 w-4 translate-x-4 transform rounded-full bg-white" />
                  </span>
                </div>
                <textarea
                  value={dmText}
                  onChange={(e) => setDmText(e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-[#232D3A] bg-[#0B0F14] px-3.5 py-2.5 text-sm text-[#E7ECF2] outline-none transition-colors focus:border-[#4F7CFF]"
                />
                <p className="mt-1.5 text-xs text-[#7C8A9C]">
                  Обязательное поле — отправляется в директ подписчику
                </p>
              </div>

              <div className="rounded-xl border border-[#232D3A] bg-[#141B24] p-4">
                <p className="mb-3 text-sm font-medium text-[#E7ECF2]">
                  ответы на комментарий
                </p>
                <div className="space-y-2">
                  {replyTexts.map((text, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={text}
                        onChange={(e) => updateReplyText(i, e.target.value)}
                        className="flex-1 rounded-lg border border-[#232D3A] bg-[#0B0F14] px-3.5 py-2.5 text-sm text-[#E7ECF2] outline-none transition-colors focus:border-[#4F7CFF]"
                      />
                      {replyTexts.length > 1 && (
                        <button
                          onClick={() => removeReplyVariant(i)}
                          className="px-2 text-[#F87171]"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addReplyVariant}
                  className="mt-2 text-xs text-[#4F7CFF] hover:underline"
                >
                  + добавить вариант
                </button>
              </div>

              {stepError && (
                <p className="mt-4 text-sm text-[#F87171]">{stepError}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="mt-6 w-full rounded-lg bg-[#4F7CFF] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3D68EA] disabled:opacity-50"
              >
                {saving
                  ? "Сохраняем…"
                  : editingTemplate
                    ? "Сохранить изменения"
                    : "Создать шаблон"}
              </button>
            </>
          )}
        </div>

        <div className="hidden flex-1 items-center justify-center overflow-hidden bg-[#05070A] p-10 lg:flex">
          <PhonePreview
            step={step}
            username={username}
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
          />
        </div>
      </div>
    </div>
  );
}
