export type TemplateReply = { id?: string; text: string };
export type TemplateLink = { text: string; url: string };

/** Аналитика шаблона — воронка из 3 счётчиков (см. entities/template/
 * types.ts комментарий у самого поля ниже для деталей). Один плоский
 * объект, не 3 отдельных поля на Template — сразу видно, что это цельный
 * "пакет" данных с бэкенда, который либо есть целиком, либо отсутствует
 * целиком (шаблон ещё не поддерживается аналитикой), а не частично
 * разъехавшиеся отдельные поля. */
export type TemplateAnalytics = {
  /** Сколько раз сработал триггер (совпал комментарий/сообщение). */
  started: number;
  /** Сколько раз было отправлено сообщение, СОДЕРЖАЩЕЕ ссылку (не любое
   * сообщение автоматизации — см. CLAUDE.md, обсуждение "Sends" vs
   * отдельный counter для CTR). 0, если у шаблона вообще нет
   * настроенной ссылки. */
  linkSent: number;
  /** Сколько раз по этой ссылке кликнули. Instagram НЕ даёт это
   * бесплатно (url-кнопки не шлют вебхук, только postback-кнопки —
   * задокументированный факт, не наше предположение) — считается через
   * собственный редирект-сервис бэкенда, см. промпт. */
  linkClicked: number;
};

export type Template = {
  id: string;
  // Название шаблона — НАСТОЯЩЕЕ поле (не forward-compatible заглушка,
  // как большинство остального ниже): юзер сам вводит при создании,
  // видит на странице деталей автоматизации. Опционально на типе (пока
  // backend не всегда его отдаёт — например, старые шаблоны, созданные
  // до появления этого поля) — компоненты, которые его показывают, сами
  // подставляют осмысленный дефолт при отсутствии.
  name?: string | null;
  // Аналитика — НОВОЕ, backend пока не хранит и не отдаёт (форвард-
  // совместимо, промпт см. память проекта). `undefined`/`null` — ещё не
  // поддерживается, не "все нули": страница деталей различает эти
  // состояния (см. TemplateAnalyticsSection.tsx).
  analytics?: TemplateAnalytics | null;
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
  // НОВОЕ настоящее поле — см. комментарий у `name` в Template выше.
  name: string;
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
  name: string;
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
