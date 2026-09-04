export type TemplateReply = { id?: string; text: string };
export type TemplateLink = { text: string; url: string };

export type Template = {
  id: string;
  // Дискриминатор типа автоматизации — НОВОЕ, backend пока не хранит и не
  // отдаёт (тот же forward-compatible паттерн, что и остальные НОВЫЕ поля
  // ниже). Отсутствует/`null` у уже существующих шаблонов — трактуем как
  // "comment" (единственный тип, который вообще существовал до этого,
  // см. CLAUDE.md "План: типы автоматизаций"), не как ошибку/незаполненное
  // поле.
  type?: "comment" | "dm" | null;
  post_id: string | null;
  keyword: string | null;
  dm_text: string;
  is_active: boolean;
  // Только для type "comment" — варианты ответа НА КОММЕНТАРИЙ (не путать
  // с dm_text, тем самым сообщением в директ).
  template_replies: TemplateReply[];
  // Проверка подписки перед выдачей — backend реализуется отдельной
  // задачей, поэтому поля опциональны, пока API их не отдаёт. Общие для
  // ОБОИХ типов шаблона (comment и dm) — механика "спросить подписку,
  // прежде чем выдать" не завязана на способ триггера.
  require_follow_check?: boolean;
  button_text_initial?: string | null;
  message_if_not_following?: string | null;
  button_text_follow_confirm?: string | null;
  message_after_follow?: string | null;
  // Кнопка-ссылка под финальным сообщением ("После подписки") — открывает
  // URL напрямую, в отличие от button_text_* выше (те триггерят следующее
  // сообщение бота). Backend пока не хранит и не отдаёт эти поля — задача
  // поставлена отдельным промптом (см. CLAUDE.md, "Аватарка IG-аккаунта"
  // для примера того же паттерна с avatar_url). ТОЛЬКО для type "comment" —
  // у "dm" своя, отдельная кнопка-ссылка(и), см. `links` ниже.
  link_button_text?: string | null;
  link_button_url?: string | null;
  // Точное совпадение слова-триггера с текстом комментария/сообщения
  // (целиком, не подстрокой) — НОВОЕ, backend пока не хранит и не отдаёт
  // (тот же паттерн, что link_button_*/avatar_url выше). Общее для обоих
  // типов — у "dm" сравнивается с текстом входящего сообщения, не
  // комментария.
  exact_match?: boolean | null;
  // Повторяемый список кнопок-ссылок под ответным DM — ТОЛЬКО для type
  // "dm" (аналог link_button_text/url у "comment", но МНОЖЕСТВЕННЫЙ —
  // референс конкурента поддерживает несколько ссылок сразу, "+ Add A
  // Link"). НОВОЕ, backend пока не хранит и не отдаёт — форвард-
  // совместимо, задача отдельным промптом.
  links?: TemplateLink[] | null;
};

/** Поля, общие для обоих типов шаблона — механика "спросить подписку,
 * прежде чем выдать материал", идентична у comment и dm (см. Template
 * выше). Вынесено, чтобы не дублировать один и тот же набор полей в двух
 * веток TemplateInput ниже. */
type FollowCheckFields = {
  requireFollowCheck: boolean;
  buttonTextInitial: string;
  messageIfNotFollowing: string;
  buttonTextFollowConfirm: string;
  messageAfterFollow: string;
};

export type CommentTemplateInput = FollowCheckFields & {
  type: "comment";
  postId: string | null;
  keyword: string | null;
  exactMatch: boolean;
  dmText: string;
  replyTexts: string[];
  // НОВОЕ, backend пока не поддерживает (см. комментарий у link_button_*
  // в Template выше) — отправляем forward-compatible, бэкенд игнорирует.
  linkButtonText: string;
  linkButtonUrl: string;
};

export type DmTemplateInput = FollowCheckFields & {
  type: "dm";
  keyword: string | null;
  exactMatch: boolean;
  dmText: string;
  // НОВОЕ, см. комментарий у `links` в Template выше.
  links: TemplateLink[];
};

/** Дискриминированное объединение, не один "плоский" тип с необязательными
 * полями на все случаи — так каждый визард (CommentTemplateWizard/
 * DmTemplateWizard) собирает СВОЙ, типобезопасный body, и невозможно
 * случайно отправить, скажем, `replyTexts` в DM-шаблон. */
export type TemplateInput = CommentTemplateInput | DmTemplateInput;
