import { AtSign, Zap, PauseCircle } from "lucide-react";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Avatar } from "@astryxdesign/core/Avatar";
import { AvatarGroup, AvatarGroupOverflow } from "@astryxdesign/core/AvatarGroup";
import type { IgAccount } from "@/entities/ig-account/types";

const MAX_VISIBLE_AVATARS = 3;

/**
 * 3 плашки вместо одной строки "N подключённых аккаунтов" — редизайн
 * 2026-09 (см. Claude Design канвас, направление "в духе Stan Store").
 * Все три числа считаются на фронте из данных, которые страница и так уже
 * загружает (accounts + шаблоны по всем аккаунтам) — никакой новой
 * бэкенд-аналитики тут нет, в отличие от `TemplateAnalytics` на странице
 * деталей шаблона.
 */
export function StatsRow({
  accounts,
  activeTemplatesCount,
  inactiveTemplatesCount,
  loading,
}: {
  accounts: IgAccount[];
  activeTemplatesCount: number;
  inactiveTemplatesCount: number;
  loading: boolean;
}) {
  // Классы — литеральные строки целиком (не собранные через шаблонную
  // строку из куска имени): Tailwind JIT сканирует исходники по
  // буквальному тексту класса, `bg-${tone}` в рантайме для него невидим и
  // просто не попал бы в собранный CSS. Названия — из Tailwind-бриджа
  // Astryx (`astryx docs styling`): категориальный hue "blue" даёт только
  // bg-blue-subtle/text-blue-vivid (нет голого bg-blue), а "активно"/
  // "выключено" — семантические bg-success/text-secondary, не decorative
  // hue-цвета.
  const stats = [
    {
      icon: <AtSign size={18} />,
      value: accounts.length,
      label: "аккаунтов подключено",
      chipClassName: "bg-blue-subtle text-blue-vivid",
    },
    {
      icon: <Zap size={18} />,
      value: activeTemplatesCount,
      label: "активных шаблона",
      chipClassName: "bg-success-muted text-success",
    },
    {
      icon: <PauseCircle size={18} />,
      value: inactiveTemplatesCount,
      label: "выключено",
      chipClassName: "bg-muted text-secondary",
    },
  ];

  const visibleAccounts = accounts.slice(0, MAX_VISIBLE_AVATARS);
  const hiddenAccountsCount = accounts.length - visibleAccounts.length;

  return (
    <div className="mb-8 flex gap-4">
      {stats.map((stat, i) => (
        // Card сам не принимает className/flex — равная ширина в ряду
        // навешивается на обёртку снаружи (Card поддерживает только
        // width/height как SizeValue-пропы, не Tailwind-классы).
        <div key={stat.label} className="flex-1">
          <Card padding={4} elevation="low">
            <div className="mb-3 flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.chipClassName}`}
              >
                {stat.icon}
              </div>
              {loading ? (
                <Skeleton width={28} height={22} index={i} />
              ) : (
                <Text className="text-2xl font-extrabold leading-none">
                  {stat.value}
                </Text>
              )}
            </div>
            <Text color="secondary" type="supporting">
              {stat.label}
            </Text>

            {/* Мини-превью реальных подключённых аккаунтов — только на
                первой плашке, только когда есть что показать. */}
            {i === 0 && !loading && visibleAccounts.length > 0 && (
              <div className="mt-2">
                <AvatarGroup size="xsm">
                  {visibleAccounts.map((acc) => (
                    <Avatar key={acc.id} name={acc.username} src={acc.avatar_url ?? undefined} />
                  ))}
                  {hiddenAccountsCount > 0 && (
                    <AvatarGroupOverflow count={hiddenAccountsCount} />
                  )}
                </AvatarGroup>
              </div>
            )}
          </Card>
        </div>
      ))}
    </div>
  );
}
