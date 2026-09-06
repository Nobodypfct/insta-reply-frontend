import { defineTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral";

/**
 * Редизайн 2026-09 — направление "в духе Stan Store" (макет — Claude
 * Design канвас, см. переписку), ЦА: молодые инфлюенсеры/криэйторы.
 * Акцент — мятно-изумрудный зелёный, как на макете.
 *
 * ПОЧЕМУ ТУТ ЛИТЕРАЛЬНЫЕ oklch, а не `var(--color-*)`, как было раньше
 * (`var(--color-text-blue)`, потом `var(--color-text-purple)`): в готовой
 * hue-палитре Astryx нет зелёного нужного оттенка — `--color-icon-green`
 * (#0D8626) травяной и уводит в жёлтый, `--color-icon-teal` (#009688) —
 * наоборот в циан. Макет рисовался в oklch (H≈163-165), поэтому бренд-
 * цвет задаём здесь напрямую. Правило проекта "никаких захардкоженных
 * hex" — про КОМПОНЕНТЫ (там по-прежнему только токены); файл темы как
 * раз то единственное место, где значению цвета и положено жить.
 *
 * Три токена, а не один: `--color-text-accent`/`--color-icon-accent` в
 * `neutralTheme` — СВОИ литеральные значения, не `var(--color-accent)`-
 * ссылки (проверено по исходнику пакета), так что правка только
 * `--color-accent` молча оставила бы текст/иконки серыми.
 *
 * Светлоты разные намеренно: заливка (`--color-accent` — кнопки, Switch,
 * ProgressBar) чуть темнее макетной, чтобы белый текст на ней читался
 * (~3.6:1 против 2.3:1 у макетного oklch(68% …)); текстовый акцент ещё
 * темнее — ссылки на белом дают ~5:1. Приложение всегда в `mode="light"`
 * (см. AstryxProvider.tsx), тёмная схема темы не используется, поэтому
 * `--color-on-accent` (белый у neutralTheme) не трогаем.
 *
 * `--radius-container` — `neutralTheme` даёт 0.75rem (12px), на макете
 * карточки заметно круглее (~20px). У Card/ClickableCard нет пропа под
 * радиус — только токен темы, поэтому правится глобально (единый радиус
 * по всему UI как раз и имелся в виду под "в соответствии с дизайном").
 *
 * `components['app-shell-sidenav']` — сайдбар на макете это БЕЛАЯ
 * плавающая карточка с отступом и тенью, а не сплошная колонка во всю
 * высоту. У AppShell нет пропа под такой вид (`variant` даёт только
 * wash/surface/section/elevated), но сама панель получает стабильный
 * класс `.astryx-app-shell-sidenav` (см. themeProps в AppShell.js) —
 * это штатная точка кастомизации темы, а не хак поверх чужой вёрстки.
 */
export const customTheme = defineTheme({
  name: "insta-reply",
  extends: neutralTheme,
  tokens: {
    "--color-accent": "oklch(60% 0.15 163)",
    "--color-text-accent": "oklch(48% 0.12 163)",
    "--color-icon-accent": "oklch(55% 0.14 163)",
    "--radius-container": "1.25rem",
  },
  components: {
    "app-shell-sidenav": {
      base: {
        margin: "16px 0 16px 16px",
        borderRadius: "22px",
        backgroundColor: "var(--color-background-surface)",
        boxShadow:
          "0 1px 2px rgba(0, 0, 0, 0.04), 0 12px 28px rgba(0, 0, 0, 0.05)",
        borderInlineEnd: "none",
      },
    },
  },
});
