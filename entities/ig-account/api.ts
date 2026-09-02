import { apiClient } from "@/shared/api/client";
import type { IgAccount, IgMedia } from "./types";

export function getAccounts(userId: string) {
  return apiClient.get<{ accounts: IgAccount[] }>(
    `/api/ig-accounts?user_id=${userId}`,
  );
}

export function getMedia(igAccountId: string) {
  return apiClient.get<{ media: IgMedia[] }>(
    `/api/ig-accounts/${igAccountId}/media`,
  );
}
