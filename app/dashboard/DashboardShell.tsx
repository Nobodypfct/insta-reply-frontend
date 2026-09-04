"use client";

import { useRouter, usePathname } from "next/navigation";
import NextLink from "next/link";
import { Home, AtSign, HelpCircle, LogOut, ShieldCheck } from "lucide-react";
import { AppShell } from "@astryxdesign/core/AppShell";
import { SideNav, SideNavItem } from "@astryxdesign/core/SideNav";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Text } from "@astryxdesign/core/Text";
import { IconButton } from "@astryxdesign/core/IconButton";
import { createClient } from "@/lib/supabase";

/**
 * Клиентская часть shell'а /dashboard — развёрнутый сайдбар фиксированной
 * ширины (иконка + текстовый лейбл, дефолтный вид SideNav без
 * `collapsible`). Email больше не тянет сам через useEffect (было — грузился
 * с секундной задержкой, "Профиль" мигал первым кадром) — приходит пропом
 * из app/dashboard/layout.tsx (серверный компонент), который уже сходил за
 * юзером ради самого гейта авторизации, так что второй поход за тем же не
 * нужен.
 *
 * "Настройки" сознательно НЕ добавлены: страницы настроек ещё не
 * существует, а нерабочую ссылку в постоянно видимом сайдбаре решил не
 * оставлять.
 */
export function DashboardShell({
  email,
  children,
}: {
  email: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

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
          footer={
            <>
              {/* Временное размещение "пока что" — публичная страница
                  (/privacy-policy, вне /dashboard/**, не гейтится proxy.ts),
                  но пока без отдельного маркетингового сайта/футера ссылку
                  положить больше некуда. Контент там — MVP-заглушка, см.
                  TODO в content/legal/privacy-policy.md. */}
              <SideNavItem
                label="Политика конфиденциальности"
                icon={ShieldCheck}
                href="/privacy-policy"
                as={NextLink}
              />
              <SideNavItem label="Выйти" icon={LogOut} onClick={handleLogout} />
            </>
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
