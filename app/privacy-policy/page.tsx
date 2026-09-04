import { readFileSync } from "fs";
import { join } from "path";
import { PrivacyPolicyContent } from "./PrivacyPolicyContent";

/**
 * Публичная страница — намеренно НЕ под /dashboard/**, proxy.ts её не
 * гейтит (см. CLAUDE.md, "Гейт защищённых страниц") — политику
 * конфиденциальности должен видеть кто угодно, не только залогиненные.
 *
 * Контент — MVP-заглушка (см. TODO-блок в самом content/legal/
 * privacy-policy.md), читается на сервере через fs, а не захардкожен в
 * JSX — так текст можно редактировать/отдавать на юридическую проверку
 * отдельным .md-файлом, не трогая код страницы. Сам компонент — Server
 * Component (тут нет интерактивности, читать файл можно прямо в
 * рендере); JSX с Astryx `Link`'s `as={NextLink}` вынесен в отдельный
 * "use client" компонент — см. комментарий в PrivacyPolicyContent.tsx.
 */
export default function PrivacyPolicyPage() {
  const markdown = readFileSync(
    join(process.cwd(), "content/legal/privacy-policy.md"),
    "utf-8",
  );

  return <PrivacyPolicyContent markdown={markdown} />;
}
