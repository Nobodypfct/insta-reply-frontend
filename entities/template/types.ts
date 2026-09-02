export type TemplateReply = { id?: string; text: string };

export type Template = {
  id: string;
  post_id: string | null;
  keyword: string | null;
  dm_text: string;
  is_active: boolean;
  template_replies: TemplateReply[];
};

export type TemplateInput = {
  postId: string | null;
  keyword: string | null;
  dmText: string;
  replyTexts: string[];
};
