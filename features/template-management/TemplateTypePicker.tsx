"use client";

import { MessageCircle, MessagesSquare } from "lucide-react";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { BottomSheet } from "@astryxdesign/core/BottomSheet";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { Heading } from "@astryxdesign/core/Heading";
import { Stack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { useMediaQuery } from "@astryxdesign/core/hooks";

/** Только touch-устройства ≤1024px (не просто "узкий десктоп-браузер") —
 * тот же запрос, что в официальном block-шаблоне Astryx
 * (`astryx template DialogAdaptivePresentation`), переиспользован как
 * есть, не изобретали свой. */
const TOUCH_ORIENTED_LG_QUERY =
  "(max-width: 1024px) and (pointer: coarse) and (hover: none)";

type TemplateTypeOption = {
  type: "comment" | "dm";
  title: string;
  description: string;
  icon: React.ReactNode;
};

const OPTIONS: TemplateTypeOption[] = [
  {
    type: "comment",
    title: "Ответ на комментарии",
    description: "Бот отвечает в директ тем, кто написал нужное слово под постом.",
    icon: <MessageCircle size={20} />,
  },
  {
    type: "dm",
    title: "Ответ в директ",
    description: "Бот отвечает, когда вам самим пишут в директ нужное слово.",
    icon: <MessagesSquare size={20} />,
  },
];

/**
 * Попап выбора типа автоматизации — открывается по "+ Новый шаблон"
 * (`app/dashboard/accounts/[id]/page.tsx`) и с карточек "Начать здесь"
 * на `/dashboard` (там сразу известен тип, попап не нужен — см. эти
 * страницы). `Dialog` на десктопе, `BottomSheet` на touch ≤1024px — тот
 * же паттерн, что официальный block-шаблон Astryx
 * `DialogAdaptivePresentation`, адаптированный под наши 2 опции (без
 * формы/футера — тут сам выбор карточки И есть действие, отдельная
 * кнопка "Продолжить" не нужна).
 */
export function TemplateTypePicker({
  isOpen,
  onOpenChange,
  onSelect,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelect: (type: "comment" | "dm") => void;
}) {
  const isTouchOrientedLargeOrBelow = useMediaQuery(TOUCH_ORIENTED_LG_QUERY);

  const content = (
    <Stack gap={3}>
      {OPTIONS.map((option) => (
        <ClickableCard
          key={option.type}
          label={option.title}
          padding={4}
          onClick={() => onSelect(option.type)}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-accent">
              {option.icon}
            </div>
            <div>
              <Text weight="medium" className="block">
                {option.title}
              </Text>
              <Text color="secondary" type="supporting" className="mt-0.5 block">
                {option.description}
              </Text>
            </div>
          </div>
        </ClickableCard>
      ))}
    </Stack>
  );

  if (isTouchOrientedLargeOrBelow) {
    return (
      <BottomSheet
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        label="Выбор типа автоматизации"
        purpose="info"
        height="hug"
      >
        <div className="px-4 pb-4">
          <Heading level={3} className="mb-4 text-lg font-medium">
            Что хотите создать?
          </Heading>
          {content}
        </div>
      </BottomSheet>
    );
  }

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} purpose="info" width={420}>
      <Layout
        header={
          <DialogHeader title="Что хотите создать?" onOpenChange={onOpenChange} />
        }
        content={<LayoutContent>{content}</LayoutContent>}
      />
    </Dialog>
  );
}
