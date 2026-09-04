"use client";

import type { ReactNode } from "react";
import { Stack } from "@astryxdesign/core/Stack";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Switch } from "@astryxdesign/core/Switch";
import { DM_MESSAGE_MAX_LENGTH } from "./validation";

/**
 * "Проверять подписку перед выдачей" — идентичный блок полей у ОБОИХ
 * визардов (CommentTemplateWizard и DmTemplateWizard): механика "спросить
 * подписку → дождаться подтверждения → выдать" не завязана на то, ЧТО
 * триггернуло автоматизацию (комментарий или входящее DM) — см.
 * `entities/template/types.ts`, `FollowCheckFields` там же (общие поля
 * Template/TemplateInput). Раньше жил инлайн в TemplateWizard.tsx —
 * вынесен при появлении второго визарда, чтобы не дублировать ~80 строк
 * JSX + валидации.
 *
 * Валидация/дефолты — забота вызывающего визарда (тот же паттерн, что и
 * раньше: `schemaError()` вызывается снаружи, сюда прилетают уже готовые
 * `status`-ошибки), этот компонент чисто презентационный.
 */
export function FollowCheckFields({
  requireFollowCheck,
  onRequireFollowCheckChange,
  buttonTextInitial,
  onButtonTextInitialChange,
  messageIfNotFollowing,
  onMessageIfNotFollowingChange,
  messageIfNotFollowingError,
  buttonTextFollowConfirm,
  onButtonTextFollowConfirmChange,
  messageAfterFollow,
  onMessageAfterFollowChange,
  messageAfterFollowError,
  children,
}: {
  requireFollowCheck: boolean;
  onRequireFollowCheckChange: (checked: boolean) => void;
  buttonTextInitial: string;
  onButtonTextInitialChange: (value: string) => void;
  messageIfNotFollowing: string;
  onMessageIfNotFollowingChange: (value: string) => void;
  messageIfNotFollowingError: string | null;
  buttonTextFollowConfirm: string;
  onButtonTextFollowConfirmChange: (value: string) => void;
  messageAfterFollow: string;
  onMessageAfterFollowChange: (value: string) => void;
  messageAfterFollowError: string | null;
  /** Доп. поля, специфичные для конкретного визарда (например, кнопка-
   * ссылка у CommentTemplateWizard) — рендерятся в ТОМ ЖЕ conditional
   * Stack'е, что и 4 общих поля выше (тот же отступ/бордер-разделитель),
   * но их разметку/состояние держит вызывающий компонент — этот остаётся
   * про ОБЩУЮ для обоих визардов часть, не более. */
  children?: ReactNode;
}) {
  return (
    <>
      <Switch
        label="Проверять подписку перед выдачей"
        description="Бот попросит подписаться, прежде чем прислать материал"
        value={requireFollowCheck}
        onChange={onRequireFollowCheckChange}
        labelSpacing="spread"
      />

      {requireFollowCheck && (
        <Stack gap={4} className="mt-4 border-t border-border pt-4">
          <TextInput
            label="Текст кнопки в открывающем сообщении"
            value={buttonTextInitial}
            onChange={onButtonTextInitialChange}
          />
          <TextArea
            label="Сообщение, если подписки нет"
            value={messageIfNotFollowing}
            onChange={onMessageIfNotFollowingChange}
            rows={3}
            maxLength={DM_MESSAGE_MAX_LENGTH}
            placeholder="Похоже, ты ещё не подписан(а). Подпишись и жми кнопку ниже 👇"
            status={
              messageIfNotFollowingError
                ? { type: "error", message: messageIfNotFollowingError }
                : undefined
            }
          />
          <TextInput
            label="Текст кнопки «Я подписался»"
            value={buttonTextFollowConfirm}
            onChange={onButtonTextFollowConfirmChange}
          />
          <TextArea
            label="Финальное сообщение"
            value={messageAfterFollow}
            onChange={onMessageAfterFollowChange}
            rows={3}
            maxLength={DM_MESSAGE_MAX_LENGTH}
            placeholder="Спасибо! Вот твоя ссылка ниже 👇"
            status={
              messageAfterFollowError
                ? { type: "error", message: messageAfterFollowError }
                : undefined
            }
          />
          {children}
        </Stack>
      )}
    </>
  );
}
