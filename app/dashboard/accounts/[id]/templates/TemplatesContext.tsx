"use client";

import { createContext, useContext } from "react";
import type { Template } from "@/entities/template/types";
import type { IgAccount, IgMedia } from "@/entities/ig-account/types";

/**
 * Общие данные для всех роутов создания/редактирования шаблона
 * (new/comment, new/dm, [templateId]/edit) — грузятся ОДИН раз в
 * `layout.tsx` этого сегмента, не по 3 копии одного и того же fetch'а в
 * каждой странице. Список шаблонов (`templates`) нужен визардам ТОЛЬКО
 * для клиентской проверки "любой пост"-конфликта
 * (CommentTemplateWizard's `existingTemplates`) и для поиска
 * редактируемого шаблона по id — не для отображения списка карточек
 * (тот остаётся на родительской странице `/dashboard/accounts/[id]`,
 * этот контекст её не подменяет).
 */
export type TemplatesRouteData = {
  igAccountId: string;
  account: IgAccount | null;
  accountLoading: boolean;
  media: IgMedia[];
  mediaError: boolean;
  templates: Template[];
  loading: boolean;
};

export const TemplatesRouteContext = createContext<TemplatesRouteData | null>(
  null,
);

export function useTemplatesRoute(): TemplatesRouteData {
  const ctx = useContext(TemplatesRouteContext);
  if (!ctx) {
    throw new Error(
      "useTemplatesRoute() вызван вне TemplatesRouteContext.Provider — " +
        "используй только внутри app/dashboard/accounts/[id]/templates/**",
    );
  }
  return ctx;
}
