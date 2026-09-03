import { Badge } from "@astryxdesign/core/Badge";

/**
 * Бейдж "Включён"/"Выключен" — повторяется в списке IG-аккаунтов
 * (webhook_enabled) и в списке шаблонов (is_active) с одинаковой
 * семантикой. Тонкая обёртка над Astryx Badge, а не сам примитив —
 * инкапсулирует маппинг домена (boolean) в вариант/лейбл.
 */
export function ActiveStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant={isActive ? "success" : "neutral"}
      label={isActive ? "Включён" : "Выключен"}
    />
  );
}
