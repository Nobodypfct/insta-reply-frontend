import { AtSign, Check, PauseCircle } from "lucide-react";
import { Card } from "@astryxdesign/core/Card";
import { Text } from "@astryxdesign/core/Text";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Avatar } from "@astryxdesign/core/Avatar";
import {
  AvatarGroup,
  AvatarGroupOverflow,
} from "@astryxdesign/core/AvatarGroup";
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
      chipClassName: "bg-cyan-subtle text-cyan-vivid",
    },
    {
      icon: <Check size={18} strokeWidth={2.6} />,
      value: activeTemplatesCount,
      label: "активных шаблона",
      chipClassName: "bg-accent-muted text-accent",
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
    // Сетка, а не flex-ряд: на узком экране три плашки в строку не влезают
    // и обрезались по правому краю. Card сам не принимает className —
    // ширина навешивается на обёртку снаружи (у него только width/height
    // как SizeValue-пропы, не Tailwind-классы).
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat, i) => (
        <div key={stat.label}>
          {/* height=100% — у карточки с аккаунтами есть лишняя строка с
              аватарками, без этого она получалась выше соседних. */}
          <Card padding={4} elevation="low" height="100%">
            <div className="mb-3 flex items-center gap-3">
              <div
                className={`flex h-[38px] w-[38px] items-center justify-center rounded-[12px] ${stat.chipClassName}`}
              >
                {stat.icon}
              </div>
              {loading ? (
                <Skeleton width={28} height={22} index={i} />
              ) : (
                <Text className="text-[22px] font-extrabold leading-none">
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
                    <Avatar
                      key={acc.id}
                      name={acc.username}
                      src={acc.avatar_url ?? undefined}
                    />
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
