"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, AtSign, HelpCircle, LogOut } from "lucide-react";
import { AppShell } from "@astryxdesign/core/AppShell";
import { SideNav, SideNavItem } from "@astryxdesign/core/SideNav";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Tooltip } from "@astryxdesign/core/Tooltip";
import { IconButton } from "@astryxdesign/core/IconButton";
import { createClient } from "@/lib/supabase";

/**
 * Общий layout для всего раздела /dashboard — узкий icon-only сайдбар
 * (без текстовых подписей, как в референсе ManyChat): аватар юзера сверху,
 * навигация (Главная/Аккаунты), Help + Выйти внизу.
 *
 * SideNavItem сам оборачивается в Tooltip с текстом label, когда SideNav
 * свёрнут (isCollapsed) — отдельно оборачивать не нужно, это встроенное
 * поведение компонента.
 *
 * "Настройки" сознательно НЕ добавлены: страницы настроек ещё не
 * существует, а нерабочую ссылку в постоянно видимом сайдбаре решил не
 * оставлять (см. итоговое сообщение задачи).
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
          collapsible={{ isCollapsed: true, hasButton: false }}
          header={
            <div className="flex justify-center py-2">
              <Tooltip content={email ?? "Профиль"}>
                <Avatar name={email ?? undefined} size="sm" />
              </Tooltip>
            </div>
          }
          footerIcons={
            <div className="flex justify-center py-1">
              <Tooltip content="Помощь">
                <IconButton
                  label="Помощь"
                  icon={<HelpCircle size={18} />}
                  variant="ghost"
                />
              </Tooltip>
            </div>
          }
          footer={
            <SideNavItem label="Выйти" icon={LogOut} onClick={handleLogout} />
          }
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
