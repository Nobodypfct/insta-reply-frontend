"use client";

import { useParams, useRouter } from "next/navigation";
import { Spinner } from "@astryxdesign/core/Spinner";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { CommentTemplateWizard } from "@/features/template-management/CommentTemplateWizard";
import { DmTemplateWizard } from "@/features/template-management/DmTemplateWizard";
import { useTemplatesRoute } from "../../TemplatesContext";

export default function EditTemplatePage() {
  const params = useParams();
  const templateId = params.templateId as string;
  const router = useRouter();
  const {
    igAccountId,
    account,
    accountLoading,
    media,
    mediaError,
    templates,
    loading,
  } = useTemplatesRoute();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const template = templates.find((t) => t.id === templateId) ?? null;

  function backToList() {
    router.push(`/dashboard/accounts/${igAccountId}`);
  }

  // Реально маловероятно (пришёл по прямой ссылке на уже удалённый/чужой
  // шаблон), но раз templates уже загружены и id не нашёлся — честная
  // "не найдено", а не падение/бесконечный спиннер.
  if (!template) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <EmptyState
          title="Шаблон не найден"
          description="Возможно, он был удалён."
        />
      </div>
    );
  }

  // Отсутствующий/null type — уже существующие шаблоны, созданные до
  // появления дискриминатора типа (см. entities/template/types.ts) —
  // трактуем как "comment", единственный тип, который вообще существовал
  // до этого.
  if (template.type === "dm") {
    return (
      <DmTemplateWizard
        igAccountId={igAccountId}
        username={account?.username ?? ""}
        usernameLoading={accountLoading}
        avatarUrl={account?.avatar_url ?? null}
        editingTemplate={template}
        onClose={backToList}
        onSaved={backToList}
      />
    );
  }

  return (
    <CommentTemplateWizard
      igAccountId={igAccountId}
      username={account?.username ?? ""}
      usernameLoading={accountLoading}
      avatarUrl={account?.avatar_url ?? null}
      media={media}
      mediaError={mediaError}
      existingTemplates={templates}
      editingTemplate={template}
      onClose={backToList}
      onSaved={backToList}
    />
  );
}
