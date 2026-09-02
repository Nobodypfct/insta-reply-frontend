export type IgAccount = {
  id: string;
  ig_business_id: string;
  username: string;
  webhook_enabled: boolean;
  created_at: string;
  // Не подтверждено, что graph.instagram.com отдаёт реальный URL аватарки
  // для self-serve OAuth-подключённых аккаунтов (см. TODO в
  // dashboard/accounts/[id]/page.tsx) — поле опционально и на бэкенде
  // пока может не существовать вовсе.
  avatar_url?: string | null;
};

export type IgMedia = {
  id: string;
  caption?: string;
  thumbnail_url?: string;
  media_url?: string;
  permalink: string;
};
