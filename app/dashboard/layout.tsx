"use client";

import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, LogOut } from "lucide-react";
import { AppShell } from "@astryxdesign/core/AppShell";
import {
  SideNav,
  SideNavHeading,
  SideNavItem,
} from "@astryxdesign/core/SideNav";
import { createClient } from "@/lib/supabase";

/**
 * Общий layout для всего раздела /dashboard (включая
 * /dashboard/accounts/[id]) — базовый сайдбар: лого, "Аккаунты", "Выйти".
 * Других пунктов пока нет — партнёрка/настройки появятся отдельными
 * задачами, когда для них будут реальные страницы.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <AppShell
      contentPadding={0}
      sideNav={
        <SideNav
          header={<SideNavHeading heading="Insta-Reply" />}
          footer={
            <SideNavItem label="Выйти" icon={LogOut} onClick={handleLogout} />
          }
        >
          <SideNavItem
            label="Аккаунты"
            icon={Users}
            href="/dashboard"
            as={NextLink}
            isSelected={pathname?.startsWith("/dashboard") ?? false}
          />
        </SideNav>
      }
    >
      {children}
    </AppShell>
  );
}
