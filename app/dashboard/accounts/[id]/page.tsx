"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { getTemplates, deleteTemplate, toggleTemplateActive } from "@/entities/template/api";
import type { Template } from "@/entities/template/types";
import { getAccounts, getMedia } from "@/entities/ig-account/api";
import type { IgAccount, IgMedia } from "@/entities/ig-account/types";
import { TemplateWizard } from "@/features/template-management/TemplateWizard";

export default function TemplatesPage() {
  const params = useParams();
  const igAccountId = params.id as string;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [media, setMedia] = useState<IgMedia[]>([]);
  const [account, setAccount] = useState<IgAccount | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  async function loadData() {
    setLoading(true);
    setAccountLoading(true);

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();

    const [tplJson, mediaJson, accountsJson] = await Promise.all([
      getTemplates(igAccountId),
      getMedia(igAccountId),
      userData.user
        ? getAccounts(userData.user.id)
        : Promise.resolve({ accounts: [] as IgAccount[] }),
    ]);

    setTemplates(tplJson.templates || []);
    setMedia(mediaJson.media || []);
    setAccount(
      accountsJson.accounts?.find((a) => a.id === igAccountId) ?? null,
    );
    setAccountLoading(false);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [igAccountId]);

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
                    <div className="flex shrink-0 items-center gap-2">
                      {tpl.require_follow_check && (
                        <span
                          title="Проверка подписки перед выдачей"
                          className="flex items-center gap-1 rounded-full bg-[#4F7CFF]/15 px-2.5 py-1 text-xs text-[#4F7CFF]"
                        >
                          <ShieldCheck size={12} />
                          Подписка
                        </span>
                      )}
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full ${
                          tpl.is_active
                            ? "bg-[#22C55E]/15 text-[#4ADE80]"
                            : "bg-[#7C8A9C]/15 text-[#7C8A9C]"
                        }`}
                      >
                        {tpl.is_active ? "Включён" : "Выключен"}
                      </span>
                    </div>
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

      {wizardOpen && (
        <TemplateWizard
          igAccountId={igAccountId}
          username={account?.username ?? ""}
          usernameLoading={accountLoading}
          media={media}
          editingTemplate={editingTemplate}
          onClose={() => setWizardOpen(false)}
          onSaved={handleWizardSaved}
        />
      )}
    </main>
  );
}
