import { z } from "zod";

/**
 * Схемы валидации визарда шаблонов — намеренно ОТДЕЛЬНЫМ модулем, а не
 * инлайн в TemplateWizard.tsx: сейчас поля визарда — это набор
 * независимых `useState`, схемы вызываются вручную (`schemaError()`) и
 * результат руками кладётся в `status` проп нужного Astryx-инпута. Если
 * позже понадобится react-hook-form поверх — эти же схемы (без изменений)
 * компонуются в один `z.object({...})` и передаются в `zodResolver()`,
 * переписывать сами правила валидации не придётся, поменяется только то,
 * как форма их использует.
 */

/** Лимиты — не выдуманы, взяты по референсу ChatPlace (см. переписку по
 * задаче): 500 символов на сообщение в директе, 100 — на ответ на
 * комментарий. Кнопки/слово-триггер лимита не имеют — не были заданы. */
export const DM_MESSAGE_MAX_LENGTH = 500;
export const COMMENT_REPLY_MAX_LENGTH = 100;

export const requiredTextSchema = z.string().trim().min(1, "Обязательное поле");

export const dmMessageSchema = requiredTextSchema.max(
  DM_MESSAGE_MAX_LENGTH,
  `Не длиннее ${DM_MESSAGE_MAX_LENGTH} символов`,
);

// z.string().url() — deprecated в zod v4, актуальный способ — z.url()
// отдельным конструктором (см. node_modules/zod/v4/classic/schemas.d.ts).
// Пустую строку намеренно не гоняем через эту схему — "обязательность"
// поля со ссылкой проверяется отдельно в TemplateWizard (та же логика,
// что и у остальных required-полей этого шага), тут только формат.
export const urlSchema = z.url(
  "Введите корректный URL (например, https://example.com)",
);

/** Лимит длины комментарийного ответа — БЕЗ проверки на "обязательность":
 * в отличие от DM-сообщений, отдельный вариант ответа на комментарий
 * легитимно может быть пустым (вариантов несколько, обязателен хотя бы
 * один — это уже step-level проверка в TemplateWizard, не per-field). */
export function commentReplyLengthError(value: string): string | null {
  return value.length > COMMENT_REPLY_MAX_LENGTH
    ? `Не длиннее ${COMMENT_REPLY_MAX_LENGTH} символов`
    : null;
}

/** Прогоняет схему и достаёт текст первой ошибки — или null, если всё ок.
 * Тонкая обёртка ровно под форму, которую ждёт Astryx `status` проп. */
export function schemaError(
  schema: z.ZodType<string>,
  value: string,
): string | null {
  const result = schema.safeParse(value);
  return result.success
    ? null
    : (result.error.issues[0]?.message ?? "Некорректное значение");
}
