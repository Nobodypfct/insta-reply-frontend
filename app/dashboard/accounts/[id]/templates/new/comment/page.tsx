"use client";

import { useRouter } from "next/navigation";
import { Spinner } from "@astryxdesign/core/Spinner";
import { CommentTemplateWizard } from "@/features/template-management/CommentTemplateWizard";
import { useTemplatesRoute } from "../../TemplatesContext";

export default function NewCommentTemplatePage() {
  const router = useRouter();
  const { igAccountId, account, accountLoading, media, mediaError, templates, loading } =
    useTemplatesRoute();

  // Данные (аккаунт/медиа/список для any-post-конфликта) грузятся в
  // родительском layout.tsx — визарду они нужны с самого начала (не
  // умеет "догрузиться на лету"), поэтому просто ждём здесь, коротко.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  function backToList() {
    router.push(`/dashboard/accounts/${igAccountId}`);
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
      editingTemplate={null}
      onClose={backToList}
      onSaved={backToList}
    />
  );
}
