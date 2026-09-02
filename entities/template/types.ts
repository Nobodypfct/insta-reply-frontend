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
};
