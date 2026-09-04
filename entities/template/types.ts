export type TemplateReply = { id?: string; text: string };

export type Template = {
  id: string;
  post_id: string | null;
  keyword: string | null;
  dm_text: string;
  is_active: boolean;
  template_replies: TemplateReply[];
  // Проверка подписки перед выдачей — backend реализуется отдельной
  // задачей, поэтому поля опциональны, пока API их не отдаёт.
  require_follow_check?: boolean;
  button_text_initial?: string | null;
  message_if_not_following?: string | null;
  button_text_follow_confirm?: string | null;
  message_after_follow?: string | null;
  // Кнопка-ссылка под финальным сообщением ("После подписки") — открывает
  // URL напрямую, в отличие от button_text_* выше (те триггерят следующее
  // сообщение бота). Backend пока не хранит и не отдаёт эти поля — задача
  // поставлена отдельным промптом (см. CLAUDE.md, "Аватарка IG-аккаунта"
  // для примера того же паттерна с avatar_url).
  link_button_text?: string | null;
  link_button_url?: string | null;
  // Точное совпадение слова-триггера с текстом комментария (целиком, не
  // подстрокой) — НОВОЕ, backend пока не хранит и не отдаёт (тот же
  // паттерн, что link_button_*/avatar_url выше — см. CLAUDE.md, "Аватарка
  // IG-аккаунта"). Задача поставлена отдельным промптом.
  exact_match?: boolean | null;
};

export type TemplateInput = {
  postId: string | null;
  keyword: string | null;
  dmText: string;
  replyTexts: string[];
  // Имена полей ниже фиксированы API-контрактом бэкенда — не переименовывать.
  requireFollowCheck: boolean;
  buttonTextInitial: string;
  messageIfNotFollowing: string;
  buttonTextFollowConfirm: string;
  messageAfterFollow: string;
  // НОВОЕ, backend пока не поддерживает (см. комментарий у link_button_*
  // в Template выше) — отправляем forward-compatible, бэкенд игнорирует.
  linkButtonText: string;
  linkButtonUrl: string;
  // НОВОЕ, см. комментарий у exact_match в Template выше.
  exactMatch: boolean;
};
