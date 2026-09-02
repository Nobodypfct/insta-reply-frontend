import { apiClient } from "@/shared/api/client";
import type { IgAccount } from "./types";

export function getAccounts(userId: string) {
  return apiClient.get<{ accounts: IgAccount[] }>(
    `/api/ig-accounts?user_id=${userId}`,
  );
}
