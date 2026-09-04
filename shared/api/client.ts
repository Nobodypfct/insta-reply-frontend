const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;
  /**
   * Машиночитаемый код ошибки (`json.code` в теле ответа) — опционален,
   * есть не у всех ошибок. Точечно, не общая система: заводить полноценную
   * типизацию/маппинг кодов пока рано (во всём проекте пока 2 таких
   * прецедента — см. CLAUDE.md, "Типизация ошибок API"), это поле — задел
   * под неё, а не она сама. Используется, когда вызывающему коду нужно
   * различить конкретную известную ошибку от общего "что-то пошло не так"
   * (например `any_post_template_exists` в TemplateWizard).
   */
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let message = res.statusText;
    let code: string | undefined;
    try {
      const json = await res.json();
      message = json.error || json.message || message;
      code = typeof json.code === "string" ? json.code : undefined;
    } catch {
      // тело не JSON — оставляем statusText
    }
    throw new ApiError(res.status, message, code);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
