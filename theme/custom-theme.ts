import { defineTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral";

/**
 * Редизайн 2026-09 — направление "в духе Stan Store" (см. переписку /
 * Claude Design канвас), выбрано под ЦА: молодые инфлюенсеры/криэйторы.
 * Глубокий сине-фиолетовый акцент вместо бледно-синего дефолта Astryx.
 * Тот же приём, что и раньше (ссылка на существующий токен через `var()`,
 * не выдуманный hex) — просто другой hue из готовой семантической
 * hue-палитры: `--color-text-purple` (`#3E0697` светлая / `#B3B0FE`
 * тёмная, см. `astryx docs tokens`) вместо `--color-text-blue`.
 *
 * ВАЖНО (проверено на исходнике `theme-neutral`, не только по докам):
 * `--color-text-accent`/`--color-icon-accent` в `neutralTheme` — это
 * СВОИ отдельные литеральные hex (`#262626`/`#ebebeb`), не `var(--color-
 * accent)`-ссылки. Поэтому переопределять нужно ВСЕ ТРИ токена явно —
 * если тронуть только `--color-accent`, текстовые/иконочные акценты
 * (`Link`, `color="accent"` и т.п.) молча останутся серыми. Ровно то же
 * самое (все три токена, один и тот же `var()`) уже делал предыдущий
 * вариант этого файла с `--color-text-blue` — просто меняем hue семьи.
 *
 * `--color-on-accent` (цвет текста НА фоне акцента, например у кнопки
 * `variant="primary"`) трогать не нужно: приложение всегда работает в
 * `mode="light"` (см. AstryxProvider.tsx) — только светлое значение
 * когда-либо реально рендерится, а оно у `neutralTheme` уже `#ffffff`
 * (белый), что даёт отличный контраст на нашем тёмном фиолетовом
 * (`#3E0697`). Dark-режим темы этот проект не использует вообще.
 *
 * `extends: neutralTheme` подхватывает всё остальное (типографику,
 * радиусы, все прочие токены) как есть — переопределяются только три
 * accent-переменные.
 */
export const customTheme = defineTheme({
  name: "insta-reply",
  extends: neutralTheme,
  tokens: {
    "--color-accent": "var(--color-text-purple)",
    "--color-text-accent": "var(--color-text-purple)",
    "--color-icon-accent": "var(--color-text-purple)",
  },
});
