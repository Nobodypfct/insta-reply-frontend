import type { SearchableItem, SearchSource } from "@astryxdesign/core/Typeahead";

/**
 * Общее между CommentTemplateWizard и DmTemplateWizard — у обоих есть
 * секция "слово-триггер" (Tokenizer с тегами), устроенная идентично.
 * Раньше жило внутри одного TemplateWizard.tsx — вынесено сюда при
 * появлении второго визарда, чтобы не дублировать.
 */

// Дефолтное слово-триггер — используется как preset-тег у НОВОГО шаблона
// обоих типов (пример, который раньше был только в placeholder'е поля).
export const DEFAULT_KEYWORD_TAG: SearchableItem = { id: "цена", label: "цена" };

// Tokenizer в режиме "только свои теги" (см. `hasCreate` на самом
// компоненте) всё равно требует searchSource — источник данных для
// автокомплита. У нас его нет (слово-триггер — произвольный ввод, не
// выбор из готового списка), поэтому источник — пустышка. Тот же приём,
// что в официальном примере Astryx (`astryx template TokenizerCreatable`).
export const emptyKeywordSource: SearchSource<SearchableItem> = {
  search: () => [],
  bootstrap: () => [],
};

/** keyword хранится и уходит на бэкенд одной строкой через запятую
 * (см. Template/TemplateInput, формат не менялся). Tokenizer работает с
 * массивом тегов — эти две функции конвертируют туда и обратно на
 * границе компонента, сам API-контракт не тронут. */
export function keywordStringToTags(
  value: string | null | undefined,
): SearchableItem[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ({ id: s, label: s }));
}

export function keywordTagsToString(tags: SearchableItem[]): string {
  return tags.map((t) => t.label.trim()).join(", ");
}
