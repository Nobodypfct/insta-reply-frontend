"use client";

import { Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";

/**
 * Пилот Astryx (astryx.atmeta.com) — открытая дизайн-система от Meta.
 * Оборачивает приложение отдельно от `Providers` (Auth.js `SessionProvider`),
 * их можно комбинировать. `mode="light"` — гарантированно светлая тема,
 * не завязанная на системные настройки ОС.
 *
 * Пилот затрагивает только /login (см. app/login/page.tsx) — остальные
 * страницы продолжают жить на самописном Tailwind, просто отрендерены
 * внутри этого провайдера без видимых изменений (Astryx-стили заскоуплены
 * через [data-astryx-theme] и .xds-* классы, наш Tailwind-код их не видит).
 */
export function AstryxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Theme theme={neutralTheme} mode="light">
      {children}
    </Theme>
  );
}
