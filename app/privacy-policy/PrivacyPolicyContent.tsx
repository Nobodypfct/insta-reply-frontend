"use client";

import NextLink from "next/link";
import { Markdown } from "@astryxdesign/core/Markdown";
import { Link } from "@astryxdesign/core/Link";

/**
 * Вынесено в отдельный "use client"-компонент из-за `as={NextLink}` —
 * Astryx `Link` принимает компонент-ссылку в проп, а функции нельзя
 * передавать напрямую из Server Component в Client Component (RSC-граница
 * сериализует только данные). page.tsx остаётся server component (читает
 * .md через fs), сюда прилетает уже готовая строка — сериализуемо, без
 * проблем.
 */
export function PrivacyPolicyContent({ markdown }: { markdown: string }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/" as={NextLink} className="mb-6 inline-block">
        ← На главную
      </Link>
      <Markdown>{markdown}</Markdown>
    </div>
  );
}
