import { apiClient } from "@/shared/api/client";
import type { Template, TemplateInput } from "./types";

export function getTemplates(igAccountId: string) {
  return apiClient.get<{ templates: Template[] }>(
    `/api/ig-accounts/${igAccountId}/templates`,
  );
}

export function createTemplate(igAccountId: string, body: TemplateInput) {
  return apiClient.post<Template>(
    `/api/ig-accounts/${igAccountId}/templates`,
    body,
  );
}

export function updateTemplate(templateId: string, body: TemplateInput) {
  return apiClient.patch<Template>(`/api/templates/${templateId}`, body);
}

export function toggleTemplateActive(templateId: string, isActive: boolean) {
  return apiClient.patch<Template>(`/api/templates/${templateId}`, {
    isActive,
  });
}

export function deleteTemplate(templateId: string) {
  return apiClient.delete<void>(`/api/templates/${templateId}`);
}
