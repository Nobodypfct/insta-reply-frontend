import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { DashboardShell } from "./DashboardShell";

/**
 * Серверный гейт для всего раздела /dashboard — защита от proxy.ts
 * "дублируется" тут намеренно (defense-in-depth, официальная рекомендация
 * Supabase для Next.js: middleware — не единственная граница доверия,
 * Server Component должен сам перепроверить сессию перед рендером
 * чувствительных данных). На практике сюда без сессии почти никогда не
 * дойти — middleware редиректит раньше; этот редирект — подстраховка на
 * случай гонки/бага в matcher'е, поэтому без ?next= (см. proxy.ts,
 * там же основная логика сохранения исходного пути).
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <DashboardShell email={user.email ?? null}>{children}</DashboardShell>;
}
