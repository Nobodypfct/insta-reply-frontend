import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

/**
 * Тот же серверный гейт, что и app/dashboard/layout.tsx — /instagram-connected
 * вне префикса /dashboard, но это тоже защищённая страница (сюда попадают
 * посреди flow подключения IG-аккаунта), поэтому у неё свой layout с той же
 * логикой, а не общий с dashboard (это разные, не вложенные друг в друга
 * ветки роутинга).
 */
export default async function InstagramConnectedLayout({
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

  return <>{children}</>;
}
