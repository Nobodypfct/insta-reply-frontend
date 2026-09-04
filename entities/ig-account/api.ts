import { apiClient } from "@/shared/api/client";
import type { IgAccount, IgMedia } from "./types";

/** Без user_id — бэкенд определяет текущего юзера по Bearer-токену
 * (Authorization-заголовок добавляется в shared/api/client.ts), не по
 * query-параметру. Эндпоинт отдаёт аккаунты ровно того юзера, чей токен
 * пришёл в запросе. */
export function getAccounts() {
  return apiClient.get<{ accounts: IgAccount[] }>("/api/ig-accounts");
}

export function getMedia(igAccountId: string) {
  return apiClient.get<{ media: IgMedia[] }>(
    `/api/ig-accounts/${igAccountId}/media`,
  );
}

/**
 * Завершает подключение Instagram-аккаунта — POST на наш бэкенд (не
 * вызов к Instagram, тот уже отработал через Auth.js OAuth-редирект до
 * этого момента, см. app/instagram-connected/page.tsx). Раньше этот
 * запрос шёл сырым fetch() прямо в компоненте — перенесён сюда, чтобы
 * получить Bearer-токен и 401-обработку из shared/api/client.ts
 * "бесплатно", а не дублировать эту логику точечно.
 */
export function completeInstagramConnect(body: {
  long_lived_token: string;
  profile_picture_url?: string | null;
  force_transfer: boolean;
}) {
  return apiClient.post<{ username: string }>(
    "/api/complete-instagram-connect",
    body,
  );
}
