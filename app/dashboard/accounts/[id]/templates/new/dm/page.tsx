"use client";

import { useRouter } from "next/navigation";
import { Spinner } from "@astryxdesign/core/Spinner";
import { DmTemplateWizard } from "@/features/template-management/DmTemplateWizard";
import { useTemplatesRoute } from "../../TemplatesContext";

export default function NewDmTemplatePage() {
  const router = useRouter();
  const { igAccountId, account, accountLoading, loading } = useTemplatesRoute();

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
    <DmTemplateWizard
      igAccountId={igAccountId}
      username={account?.username ?? ""}
      usernameLoading={accountLoading}
      avatarUrl={account?.avatar_url ?? null}
      editingTemplate={null}
      onClose={backToList}
      onSaved={backToList}
    />
  );
}
