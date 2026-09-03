"use client";

import { Theme } from "@astryxdesign/core/theme";
import { customTheme } from "@/theme/custom-theme";

/**
 * Astryx (astryx.atmeta.com) — открытая дизайн-система от Meta. Оборачивает
 * ВСЁ приложение (после полной миграции на Astryx) отдельно от `Providers`
 * (Auth.js `SessionProvider`), их можно комбинировать. `mode="light"` —
 * гарантированно светлая тема, не завязанная на системные настройки ОС.
 *
 * Единственное осознанное исключение — содержимое мокапа iPhone внутри
 * визарда шаблонов (features/template-management/PhonePreview.tsx):
 * оно имитирует реальный интерфейс Instagram и намеренно тёмное. У его
 * корневого узла стоит `data-astryx-theme="instagram-mock"` — Astryx
 * теневая CSS заскоуплена через `@scope([data-astryx-theme="insta-reply"])
 * to ([data-astryx-theme])`, и ЛЮБОЙ вложенный `data-astryx-theme`
 * (неважно, зарегистрирована ли под этим именем настоящая тема) обрывает
 * область действия внешней темы для потомков — см. комментарий на месте.
 *
 * `customTheme` = neutralTheme + синий accent (см. theme/custom-theme.ts).
 * Тема больше не "built" (собирается в рантайме через defineTheme), поэтому
 * статический @import theme-neutral/theme.css в globals.css убран — CSS
 * инжектится сама Theme при монтировании.
 */
export function AstryxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Theme theme={customTheme} mode="light">
      {children}
    </Theme>
  );
}
