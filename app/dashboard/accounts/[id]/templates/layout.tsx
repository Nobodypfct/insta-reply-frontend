"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getTemplates } from "@/entities/template/api";
import type { Template } from "@/entities/template/types";
import { getAccounts, getMedia } from "@/entities/ig-account/api";
import type { IgAccount, IgMedia } from "@/entities/ig-account/types";
import { TemplatesRouteContext, type TemplatesRouteData } from "./TemplatesContext";

/**
 * Общий layout для new/comment, new/dm и [templateId]/edit — грузит
 * account+media+templates ОДИН раз для всего поддерева (см. комментарий
 * в TemplatesContext.tsx). Та же логика fetch'а, что раньше жила в
 * app/dashboard/accounts/[id]/page.tsx's `loadData()` — не рефетчим
 * список шаблонов дважды, но эти роуты теперь отдельные страницы (не
 * оверлей поверх списка), поэтому и грузят данные сами, а не получают
 * их пропом от уже смонтированной родительской страницы.
 */
export default function TemplatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const igAccountId = params.id as string;

  const [templates, setTemplates] = useState<Template[]>([]);
  const [media, setMedia] = useState<IgMedia[]>([]);
  const [mediaError, setMediaError] = useState(false);
  const [account, setAccount] = useState<IgAccount | null>(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setAccountLoading(true);
      setMediaError(false);

      // allSettled — та же причина, что в исходном loadData(): media
      // отдельно падает 500-кой на протухшем IG-токене, не должна ронять
      // остальное (см. CLAUDE.md, "Переподключение Instagram").
      const [tplResult, mediaResult, accountsResult] = await Promise.allSettled([
        getTemplates(igAccountId),
        getMedia(igAccountId),
        getAccounts(),
      ]);

      if (cancelled) return;

      if (tplResult.status === "fulfilled") {
        setTemplates(tplResult.value.templates || []);
      }
      if (mediaResult.status === "fulfilled") {
        setMedia(mediaResult.value.media || []);
      } else {
        setMedia([]);
        setMediaError(true);
      }
      if (accountsResult.status === "fulfilled") {
        setAccount(
          accountsResult.value.accounts?.find((a) => a.id === igAccountId) ??
            null,
        );
      }

      setAccountLoading(false);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [igAccountId]);

  const value: TemplatesRouteData = {
    igAccountId,
    account,
    accountLoading,
    media,
    mediaError,
    templates,
    loading,
  };

  return (
    <TemplatesRouteContext.Provider value={value}>
      {children}
    </TemplatesRouteContext.Provider>
  );
}
