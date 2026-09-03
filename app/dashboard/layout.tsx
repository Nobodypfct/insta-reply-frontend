"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, AtSign, HelpCircle, LogOut } from "lucide-react";
import { AppShell } from "@astryxdesign/core/AppShell";
import { SideNav, SideNavItem } from "@astryxdesign/core/SideNav";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Text } from "@astryxdesign/core/Text";
import { IconButton } from "@astryxdesign/core/IconButton";
import { createClient } from "@/lib/supabase";

/**
 * Общий layout для всего раздела /dashboard — развёрнутый сайдбар
 * фиксированной ширины (не icon-only: иконка + текстовый лейбл рядом,
 * это дефолтный вид SideNav без `collapsible`). Аватар + email юзера
 * сверху, навигация (Главная/Аккаунты), Help + Выйти внизу.
 *
 * "Настройки" сознательно НЕ добавлены: страницы настроек ещё не
 * существует, а нерабочую ссылку в постоянно видимом сайдбаре решил не
 * оставлять.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const isAccountsSection = pathname?.startsWith("/dashboard/accounts") ?? false;
  const isHome = !isAccountsSection;

  return (
    <AppShell
      contentPadding={0}
      sideNav={
        <SideNav
          header={
            <div className="flex items-center gap-2.5 px-3 py-3">
              <Avatar name={email ?? undefined} size="md" />
              <Text
                type="supporting"
                color="secondary"
                className="min-w-0 flex-1 truncate"
              >
                {email ?? "Профиль"}
              </Text>
            </div>
          }
          footerIcons={
            <div className="px-1">
              <IconButton
                label="Помощь"
                icon={<HelpCircle size={20} />}
                variant="ghost"
                tooltip="Помощь"
              />
            </div>
          }
          footer={<SideNavItem label="Выйти" icon={LogOut} onClick={handleLogout} />}
        >
          <SideNavItem
            label="Главная"
            icon={Home}
            href="/dashboard"
            as={NextLink}
            isSelected={isHome}
          />
          <SideNavItem
            label="Аккаунты"
            icon={AtSign}
            href="/dashboard/accounts"
            as={NextLink}
            isSelected={isAccountsSection}
          />
        </SideNav>
      }
    >
      {children}
    </AppShell>
  );
}
