import { defineTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral";

/**
 * `neutralTheme` в чистом виде монохромна: `--color-accent` там
 * `#262626`/`#ebebeb` (почти чёрный/почти белый) — тема называется
 * "neutral" не просто так. Из-за этого `Link`/`Text`/`Heading` с
 * `color="accent"` и `Button variant="primary"` рендерятся серыми или
 * чёрными, а не синими.
 *
 * У темы уже есть готовый синий в семантической hue-палитре:
 * `--color-text-blue` (`#00458c` светлая / `#c7d3ff` тёмная). Ссылаемся
 * на него через `var()` — ровно тот же приём, которым сама theme-neutral
 * пользуется внутри для своего `variant:accent` у StatusDot
 * (`--color-accent: var(--color-text-blue)`, см.
 * node_modules/@astryxdesign/theme-neutral/dist/theme.css). Никакого
 * нового hex не вводим — переиспользуем существующий токен по ссылке,
 * а не копируем его значение.
 *
 * `extends: neutralTheme` подхватывает ВСЁ остальное (все токены,
 * component-overrides, иконки) как есть — переопределяются только три
 * accent-переменные, а не тема целиком.
 */
export const customTheme = defineTheme({
  name: "insta-reply",
  extends: neutralTheme,
  tokens: {
    "--color-accent": "var(--color-text-blue)",
    "--color-text-accent": "var(--color-text-blue)",
    "--color-icon-accent": "var(--color-text-blue)",
  },
});
