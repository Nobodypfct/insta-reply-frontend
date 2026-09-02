export type IgAccount = {
  id: string;
  ig_business_id: string;
  username: string;
  webhook_enabled: boolean;
  created_at: string;
};

export type IgMedia = {
  id: string;
  caption?: string;
  thumbnail_url?: string;
  media_url?: string;
  permalink: string;
};
