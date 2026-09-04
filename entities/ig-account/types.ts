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
  // Часть B задачи "переподключение Instagram" — бэкенд их пока не
  // отдаёт (заведено заранее, чтобы не переписывать тип, когда появятся).
  // needs_reconnect читается ТОЛЬКО через `?? false` везде в коде — пока
  // поля нет вообще, реконнект-UI просто никогда не показывается.
  token_expires_at?: string | null;
  needs_reconnect?: boolean;
};

export type IgMedia = {
  id: string;
  caption?: string;
  thumbnail_url?: string;
  media_url?: string;
  permalink: string;
};
