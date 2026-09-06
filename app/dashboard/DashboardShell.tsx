"use client";

import { useRouter, usePathname } from "next/navigation";
import NextLink from "next/link";
import {
  Home,
  AtSign,
  HelpCircle,
  LogOut,
  ShieldCheck,
  MessageCircle,
} from "lucide-react";
import { AppShell } from "@astryxdesign/core/AppShell";
import { SideNav, SideNavItem } from "@astryxdesign/core/SideNav";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Text } from "@astryxdesign/core/Text";
import { Divider } from "@astryxdesign/core/Divider";
import { createClient } from "@/lib/supabase";

/**
 * Клиентская часть shell'а /dashboard — развёрнутый сайдбар фиксированной
 * ширины (иконка + текстовый лейбл, дефолтный вид SideNav без
 * `collapsible`). Email не тянется тут через useEffect (было — грузился с
 * секундной задержкой, "Профиль" мигал первым кадром) — приходит пропом из
 * app/dashboard/layout.tsx (серверный компонент), который уже сходил за
 * юзером ради самого гейта авторизации.
 *
 * Порядок слотов повторяет макет (Claude Design канвас, "в духе Stan
 * Store") сверху вниз: лого → пункты навигации → промо-карточка →
 * разделитель → Помощь/Политика/Выйти → профиль. Раньше в `header` жила
 * аватарка с email — она переехала вниз, в `footerIcons` (самый нижний
 * слот SideNav), а сверху встал логотип, как на макете.
 *
 * Промо-карточка — просто ссылка на /dashboard/accounts, а НЕ вызов
 * `signIn()`: настоящий OAuth-триггер живёт там (`handleConnect`), а этот
 * шелл рендерится на КАЖДОЙ странице /dashboard/**, дублировать в нём
 * авторизационную логику незачем. Карточка не завязана на число аккаунтов
 * (тот же компромисс, что и в макете) — это визуальный призыв, не
 * состояние.
 *
 * "Помощь" — по-прежнему без действия (страницы помощи нет): раньше это
 * была отдельная иконка в footerIcons, теперь просто disabled-строка в
 * общем списке футера, как на макете.
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

  const isAccountsSection =
    pathname?.startsWith("/dashboard/accounts") ?? false;
  const isHome = !isAccountsSection;

  return (
    <AppShell
      contentPadding={0}
      sideNav={
        <SideNav
          header={
            <div className="flex items-center gap-2.5 px-2 py-1">
              <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] bg-accent-bg text-on-accent">
                <MessageCircle size={16} strokeWidth={2.2} />
              </div>
              <Text
                weight="bold"
                className="whitespace-nowrap text-[15px] tracking-tight"
              >
                Insta-Reply
              </Text>
            </div>
          }
          footerIcons={
            <div className="flex items-center gap-2.5 px-2 py-1">
              <Avatar name={email ?? undefined} size="sm" />
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
              <div className="mb-1">
                <Divider />
              </div>
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
              <div className="sidenav-logout">
                <SideNavItem
                  label="Выйти"
                  icon={LogOut}
                  onClick={handleLogout}
                />
              </div>
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

          <NextLink
            href="/dashboard/accounts"
            className="sidenav-promo relative mt-5 block overflow-hidden rounded-[18px] p-[18px]"
          >
            <span className="sidenav-promo-title relative block text-[13px] font-extrabold leading-[1.35]">
              Подключите ещё один аккаунт
            </span>
            <span className="sidenav-promo-text relative mt-1.5 block text-[12px] leading-[1.5]">
              Автоответы работают отдельно на каждый Instagram-профиль
            </span>
            <AtSign
              size={70}
              strokeWidth={1.6}
              aria-hidden
              className="sidenav-promo-glyph pointer-events-none absolute -bottom-3.5 -right-3.5"
            />
          </NextLink>
        </SideNav>
      }
    >
      {children}
    </AppShell>
  );
}
