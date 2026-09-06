import { Zap, Users, MessageCircle, Send } from "lucide-react";
import { Text } from "@astryxdesign/core/Text";
import { Badge } from "@astryxdesign/core/Badge";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import type { IgAccount } from "@/entities/ig-account/types";

type StarterCard = {
  title: string;
  icon: React.ReactNode;
  popular?: boolean;
  // Технических флоу — 2 (см. entities/template/types.ts "План: типы
  // автоматизаций"): "Автоответ на комментарии" и "Собирайте лиды через
  // комментарии" — один и тот же comment→DM механизм под разным
  // маркетинговым текстом, ведут в один и тот же визард; "Отвечайте на
  // все DM" — генуинно другой (DmTemplateWizard).
  templateType: "comment" | "dm";
};

const STARTER_CARDS: StarterCard[] = [
  {
    title: "Автоответ на комментарии",
    icon: <MessageCircle size={20} />,
    popular: true,
    templateType: "comment",
  },
  {
    title: "Собирайте лиды через комментарии",
    icon: <Users size={20} />,
    templateType: "comment",
  },
  {
    title: "Отвечайте на все DM",
    icon: <Send size={20} />,
    templateType: "dm",
  },
];

/**
 * Карточки-стартеры "Начать здесь". Вынесены из page.tsx отдельным
 * компонентом, чтобы вёрстка была ровно одна на всё (страница + визуальные
 * харнессы), а не расходилась копиями.
 *
 * Каждая карточка ведёт на СВОЙ роут создания шаблона напрямую, без попапа
 * выбора типа (TemplateTypePicker) — тип уже известен из того, какую
 * карточку нажали. Если аккаунт ровно один — ведём прямо в визард; если 0
 * или больше одного — на список аккаунтов: не с кем/не из чего выбрать
 * однозначно. Пока accounts ещё не загрузились (дефолт — []), ветка
 * `length === 1` ложна и href безопасно падает на /dashboard/accounts —
 * отдельного disabled-состояния специально не заводили.
 */
export function StarterCards({ accounts }: { accounts: IgAccount[] }) {
  return (
    // Сетка, а не фиксированные 280px из макета: макет рисовался под
    // 1680px, и на более узком окне третья карточка уезжала на вторую
    // строку. Здесь три колонки на десктопе (карточки просто ужимаются),
    // две на планшете и одна на телефоне — ряд как на макете сохраняется.
    <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
      {STARTER_CARDS.map((card) => (
        <div key={card.title}>
          <ClickableCard
            href={
              accounts.length === 1
                ? `/dashboard/accounts/${accounts[0].id}/templates/new/${card.templateType}`
                : "/dashboard/accounts"
            }
            label={card.title}
            padding={5}
            width="100%"
            elevation="low"
          >
            <div className="mb-[30px] flex items-start justify-between gap-2">
              <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[13px] bg-accent-muted text-accent">
                {card.icon}
              </div>
              {card.popular && (
                <Badge
                  variant="green"
                  label="ПОПУЛЯРНОЕ"
                  className="shrink-0"
                />
              )}
            </div>
            <Text weight="bold" className="mb-2 block text-[15px] leading-snug">
              {card.title}
            </Text>
            <Text
              color="secondary"
              type="supporting"
              className="flex items-center gap-1.5"
            >
              <Zap size={13} className="shrink-0" />
              Быстрая автоматизация
            </Text>
          </ClickableCard>
        </div>
      ))}
    </div>
  );
}
