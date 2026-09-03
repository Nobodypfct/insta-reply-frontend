"use client";

import { Theme } from "@astryxdesign/core/theme";
import { instaReplyTheme } from "@/theme/insta-reply";

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
 * `instaReplyTheme` — СОБРАННАЯ (built) версия темы (theme/insta-reply.js,
 * сгенерирован из theme/custom-theme.ts командой `astryx theme build`).
 * ВАЖНО: раньше здесь импортировался `customTheme` из theme/custom-theme.ts
 * напрямую (несобранный `defineTheme(...)`) — это вызывало заметный FOUC:
 * несобранная тема красится через `useInsertionEffect` внутри <Theme>,
 * который выполняется ТОЛЬКО на клиенте после гидратации. До этого момента
 * действовали дефолтные токены Astryx из astryx.css (голый :root, без
 * скоупа на тему) — например светло-синий accent `#0064E0` вместо нашего
 * тёмно-синего `#00458c` — и страница на секунду перекрашивалась на глазах.
 * `instaReplyTheme.__built === true`, поэтому <Theme> НЕ запускает
 * useInsertionEffect вообще — CSS уже статически заимпортирован в
 * globals.css (@import "../theme/custom-theme.css") и присутствует с
 * первого серверного пейнта. Если правишь theme/custom-theme.ts — пересобери
 * (см. комментарий в globals.css) и импортируй здесь всё равно
 * `instaReplyTheme`, не `customTheme`.
 */
export function AstryxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Theme theme={instaReplyTheme} mode="light">
      {children}
    </Theme>
  );
}
