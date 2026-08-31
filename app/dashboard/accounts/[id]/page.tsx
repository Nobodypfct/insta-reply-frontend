"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type MediaItem = {
  id: string;
  caption?: string;
  thumbnail_url?: string;
  media_url?: string;
  permalink: string;
};

type ReplyVariant = { id?: string; text: string };

type Template = {
  id: string;
  post_id: string | null;
  keyword: string | null;
  dm_text: string;
  is_active: boolean;
  template_replies: ReplyVariant[];
};

type FormState = {
  scope: "all" | "post";
  postId: string | null;
  keyword: string;
  dmText: string;
  replyTexts: string[];
};

const emptyForm: FormState = {
  scope: "all",
  postId: null,
  keyword: "",
  dmText: "Привет! Спасибо за комментарий 🙌 Вот то, что ты искал(а): [ССЫЛКА]",
  replyTexts: ["Спасибо! Ссылку отправил тебе в директ 🚀"],
};

export default function TemplatesPage() {
  const router = useRouter();
  const params = useParams();
  const igAccountId = params.id as string;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showPostPicker, setShowPostPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    const [tplRes, mediaRes] = await Promise.all([
      fetch(`${API_URL}/api/ig-accounts/${igAccountId}/templates`),
      fetch(`${API_URL}/api/ig-accounts/${igAccountId}/media`),
    ]);
    const tplJson = await tplRes.json();
    const mediaJson = await mediaRes.json();
    setTemplates(tplJson.templates || []);
    setMedia(mediaJson.media || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [igAccountId]);

  function openNewForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEditForm(tpl: Template) {
    setEditingId(tpl.id);
    setForm({
      scope: tpl.post_id ? "post" : "all",
      postId: tpl.post_id,
      keyword: tpl.keyword || "",
      dmText: tpl.dm_text,
      replyTexts: tpl.template_replies?.map((r) => r.text) || [""],
    });
    setFormOpen(true);
  }

  function updateReplyText(index: number, value: string) {
    setForm((f) => {
      const next = [...f.replyTexts];
      next[index] = value;
      return { ...f, replyTexts: next };
    });
  }

  function addReplyVariant() {
    setForm((f) => ({ ...f, replyTexts: [...f.replyTexts, ""] }));
  }

  function removeReplyVariant(index: number) {
    setForm((f) => ({
      ...f,
      replyTexts: f.replyTexts.filter((_, i) => i !== index),
    }));
  }

  async function handleSave() {
    const replyTexts = form.replyTexts.map((t) => t.trim()).filter(Boolean);
    if (replyTexts.length === 0) return;

    setSaving(true);
    const body = {
      postId: form.scope === "post" ? form.postId : null,
      keyword: form.keyword.trim() || null,
      dmText: form.dmText,
      replyTexts,
    };

    if (editingId) {
      await fetch(`${API_URL}/api/templates/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } else {
      await fetch(`${API_URL}/api/ig-accounts/${igAccountId}/templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    setSaving(false);
    setFormOpen(false);
    await loadData();
  }

  async function handleDelete(templateId: string) {
    await fetch(`${API_URL}/api/templates/${templateId}`, { method: "DELETE" });
    await loadData();
  }

  async function handleToggleActive(tpl: Template) {
    await fetch(`${API_URL}/api/templates/${tpl.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !tpl.is_active }),
    });
    await loadData();
  }

  function findMedia(postId: string | null) {
    return media.find((m) => m.id === postId);
  }

  return (
    <main className="min-h-screen bg-[#0B0F14] text-[#E7ECF2]">
      <header className="border-b border-[#1B2430] px-6 py-4 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-sm text-[#7C8A9C] hover:text-[#E7ECF2] transition-colors"
        >
          ← Назад к аккаунтам
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold">Шаблоны автоответов</h1>
          <button
            onClick={openNewForm}
            className="rounded-lg bg-[#4F7CFF] hover:bg-[#3D68EA] transition-colors text-white text-sm font-medium px-4 py-2"
          >
            + Новый шаблон
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-[#7C8A9C]">Загрузка…</p>
        ) : templates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#232D3A] px-6 py-14 text-center">
            <p className="text-sm text-[#7C8A9C]">
              Пока нет шаблонов. Создайте первый.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {templates.map((tpl) => {
              const post = findMedia(tpl.post_id);
              return (
                <li
                  key={tpl.id}
                  className="rounded-xl border border-[#232D3A] bg-[#141B24] p-5"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      {post?.thumbnail_url || post?.media_url ? (
                        <img
                          src={post.thumbnail_url || post.media_url}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#1B2430] flex items-center justify-center text-xs text-[#7C8A9C]">
                          {tpl.post_id ? "📷" : "∀"}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">
                          {tpl.post_id ? "Конкретный пост" : "Все посты"}
                        </p>
                        {tpl.keyword && (
                          <p className="text-xs text-[#7C8A9C] mt-0.5">
                            слово-триггер:{" "}
                            <span className="text-[#4F7CFF]">
                              {tpl.keyword}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full shrink-0 ${
                        tpl.is_active
                          ? "bg-[#22C55E]/15 text-[#4ADE80]"
                          : "bg-[#7C8A9C]/15 text-[#7C8A9C]"
                      }`}
                    >
                      {tpl.is_active ? "Включён" : "Выключен"}
                    </span>
                  </div>

                  <div className="text-xs text-[#7C8A9C] space-y-1 mb-4">
                    <p>
                      <span className="text-[#9AA7B5]">Ответы на коммент:</span>{" "}
                      {tpl.template_replies?.map((r) => r.text).join(" · ")}
                    </p>
                    <p>
                      <span className="text-[#9AA7B5]">DM:</span> {tpl.dm_text}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditForm(tpl)}
                      className="text-xs text-[#4F7CFF] hover:underline"
                    >
                      Изменить
                    </button>
                    <span className="text-[#232D3A]">·</span>
                    <button
                      onClick={() => handleToggleActive(tpl)}
                      className="text-xs text-[#7C8A9C] hover:text-[#E7ECF2] transition-colors"
                    >
                      {tpl.is_active ? "Выключить" : "Включить"}
                    </button>
                    <span className="text-[#232D3A]">·</span>
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      className="text-xs text-[#F87171] hover:underline"
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-[#232D3A] bg-[#141B24] p-6">
            <h2 className="text-base font-semibold mb-5">
              {editingId ? "Изменить шаблон" : "Новый шаблон"}
            </h2>

            {/* область действия */}
            <div className="mb-4">
              <label className="block text-sm text-[#7C8A9C] mb-2">
                Область действия
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setForm((f) => ({ ...f, scope: "all", postId: null }))
                  }
                  className={`flex-1 rounded-lg border text-sm py-2 transition-colors ${
                    form.scope === "all"
                      ? "border-[#4F7CFF] bg-[#4F7CFF]/10 text-[#4F7CFF]"
                      : "border-[#232D3A] text-[#7C8A9C]"
                  }`}
                >
                  На все посты
                </button>
                <button
                  onClick={() => {
                    setForm((f) => ({ ...f, scope: "post" }));
                    setShowPostPicker(true);
                  }}
                  className={`flex-1 rounded-lg border text-sm py-2 transition-colors ${
                    form.scope === "post"
                      ? "border-[#4F7CFF] bg-[#4F7CFF]/10 text-[#4F7CFF]"
                      : "border-[#232D3A] text-[#7C8A9C]"
                  }`}
                >
                  На конкретный пост
                </button>
              </div>

              {form.scope === "post" && (
                <div className="mt-3">
                  {form.postId ? (
                    <div className="flex items-center gap-3 rounded-lg border border-[#232D3A] p-2">
                      {(() => {
                        const m = findMedia(form.postId);
                        return m?.thumbnail_url || m?.media_url ? (
                          <img
                            src={m.thumbnail_url || m.media_url}
                            alt=""
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-[#1B2430]" />
                        );
                      })()}
                      <p className="text-xs text-[#9AA7B5] flex-1 truncate">
                        {findMedia(form.postId)?.caption || form.postId}
                      </p>
                      <button
                        onClick={() => setShowPostPicker(true)}
                        className="text-xs text-[#4F7CFF] hover:underline shrink-0"
                      >
                        Изменить
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowPostPicker(true)}
                      className="w-full text-sm text-[#4F7CFF] border border-dashed border-[#232D3A] rounded-lg py-2 hover:border-[#4F7CFF] transition-colors"
                    >
                      Выбрать пост
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* кодовое слово */}
            <div className="mb-4">
              <label className="block text-sm text-[#7C8A9C] mb-1.5">
                Кодовое слово (необязательно)
              </label>
              <input
                type="text"
                value={form.keyword}
                onChange={(e) =>
                  setForm((f) => ({ ...f, keyword: e.target.value }))
                }
                placeholder="например: цена — сработает только если слово есть в комменте"
                className="w-full rounded-lg bg-[#0B0F14] border border-[#232D3A] px-3.5 py-2.5 text-sm outline-none focus:border-[#4F7CFF] transition-colors"
              />
            </div>

            {/* варианты ответа на коммент */}
            <div className="mb-4">
              <label className="block text-sm text-[#7C8A9C] mb-1.5">
                Варианты ответа на комментарий
              </label>
              <div className="space-y-2">
                {form.replyTexts.map((text, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={text}
                      onChange={(e) => updateReplyText(i, e.target.value)}
                      className="flex-1 rounded-lg bg-[#0B0F14] border border-[#232D3A] px-3.5 py-2.5 text-sm outline-none focus:border-[#4F7CFF] transition-colors"
                    />
                    {form.replyTexts.length > 1 && (
                      <button
                        onClick={() => removeReplyVariant(i)}
                        className="text-[#F87171] px-2"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addReplyVariant}
                className="text-xs text-[#4F7CFF] hover:underline mt-2"
              >
                + добавить вариант
              </button>
            </div>

            {/* текст DM */}
            <div className="mb-6">
              <label className="block text-sm text-[#7C8A9C] mb-1.5">
                Текст сообщения в директ
              </label>
              <textarea
                value={form.dmText}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dmText: e.target.value }))
                }
                rows={3}
                className="w-full rounded-lg bg-[#0B0F14] border border-[#232D3A] px-3.5 py-2.5 text-sm outline-none focus:border-[#4F7CFF] transition-colors resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setFormOpen(false)}
                className="flex-1 rounded-lg border border-[#232D3A] text-sm text-[#9AA7B5] py-2.5 hover:text-[#E7ECF2] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving || (form.scope === "post" && !form.postId)}
                className="flex-1 rounded-lg bg-[#4F7CFF] hover:bg-[#3D68EA] disabled:opacity-50 transition-colors text-white text-sm font-medium py-2.5"
              >
                {saving ? "Сохраняем…" : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPostPicker && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-[60]">
          <div className="w-full max-w-md max-h-[70vh] overflow-y-auto rounded-xl border border-[#232D3A] bg-[#141B24] p-5">
            <h3 className="text-sm font-semibold mb-4">Выберите пост</h3>
            <div className="grid grid-cols-3 gap-2">
              {media.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setForm((f) => ({ ...f, postId: m.id }));
                    setShowPostPicker(false);
                  }}
                  className="aspect-square rounded-lg overflow-hidden bg-[#0B0F14] border border-[#232D3A] hover:border-[#4F7CFF] transition-colors"
                >
                  {m.thumbnail_url || m.media_url ? (
                    <img
                      src={m.thumbnail_url || m.media_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-[#7C8A9C]">
                      нет превью
                    </div>
                  )}
                </button>
              ))}
            </div>
            {media.length === 0 && (
              <p className="text-sm text-[#7C8A9C] text-center py-6">
                Постов не найдено.
              </p>
            )}
            <button
              onClick={() => setShowPostPicker(false)}
              className="w-full mt-4 text-sm text-[#7C8A9C] hover:text-[#E7ECF2] transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
