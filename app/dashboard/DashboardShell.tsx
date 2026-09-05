"use client";

import { useRouter, usePathname } from "next/navigation";
import NextLink from "next/link";
import { Home, AtSign, HelpCircle, LogOut, ShieldCheck, MessageCircle } from "lucide-react";
import { AppShell } from "@astryxdesign/core/AppShell";
import { SideNav, SideNavItem } from "@astryxdesign/core/SideNav";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Text } from "@astryxdesign/core/Text";
import { Divider } from "@astryxdesign/core/Divider";
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
 * Верхняя часть сайдбара — редизайн 2026-09 (Claude Design канвас, "в духе
 * Stan Store"), пикселя-в-пиксель с макетом:
 * - `header` — логотип-марка + вордмарк "Insta-Reply" (раньше тут была
 *   аватарка+email — перенесены вниз, в `footerIcons`, чтобы совпасть с
 *   макетом, где профиль — самый нижний элемент сайдбара).
 * - Промо-карточка "Подключите ещё один аккаунт" — просто `NextLink` на
 *   /dashboard/accounts (не сам `signIn()`): реальный OAuth-триггер уже
 *   живёт там (`handleConnect`), дублировать его в общем шелле, который
 *   рендерится на КАЖДОЙ странице /dashboard/**, не стали — сама карточка
 *   не завязана на наличие/число аккаунтов (тот же компромисс, что и в
 *   макете), это чисто визуальный призыв, не операционная проверка.
 *   Положена в `footer` (а не в `children`) — `children` документирован
 *   как "Navigation sections and items", рисковать его внутренней
 *   ARIA/keyboard-навигацией ради непримечательного `<a>` не стали;
 *   `footer`/`footerIcons` — свободные ReactNode-слоты.
 * - "Помощь" был `IconButton` без `onClick` (чисто декоративная иконка,
 *   реальной страницы помощи как не было, так и нет) — теперь просто
 *   выглядит как остальные строчки футера (не как отдельный компактный
 *   значок), поведение то же самое (некликабелен).
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
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-bg text-on-accent">
                <MessageCircle size={16} />
              </div>
              <Text weight="bold" className="text-[15px] tracking-tight">
                Insta-Reply
              </Text>
            </div>
          }
          footerIcons={
            <div className="flex items-center gap-2.5 px-2 py-1">
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
          footer={
            <>
              <NextLink
                href="/dashboard/accounts"
                className="mx-1 mb-3 block rounded-2xl bg-accent-muted p-4"
              >
                <Text weight="medium" type="supporting" className="mb-1 block">
                  Подключите ещё один аккаунт
                </Text>
                <Text color="secondary" type="supporting" className="block text-xs">
                  Автоответы работают отдельно на каждый Instagram-профиль
                </Text>
              </NextLink>
              <div className="mb-1">
                <Divider />
              </div>
              {/* Декоративная — как и раньше (IconButton без onClick), реальной
                  страницы помощи ещё нет. */}
              <SideNavItem label="Помощь" icon={HelpCircle} isDisabled />
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
