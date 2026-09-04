import { createClient } from "@/lib/supabase";
import { sanitizeNextPath } from "@/shared/lib/next-url";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;
  /**
   * Машиночитаемый код ошибки (`json.code` в теле ответа) — опционален,
   * есть не у всех ошибок. Точечно, не общая система: заводить полноценную
   * типизацию/маппинг кодов пока рано (во всём проекте пока несколько
   * таких прецедентов — см. CLAUDE.md, "Типизация ошибок API"), это поле —
   * задел под неё, а не она сама.
   */
  code?: string;
  /**
   * Полное распарсенное тело ответа — для ошибок, которым нужны поля сверх
   * message/code (например 409 при подключении Instagram несёт ещё
   * `username`/`existingOwnerEmail`, см. app/instagram-connected/page.tsx).
   * Большинству вызывающих это поле не нужно — обычно достаточно
   * message/code.
   */
  body?: unknown;

  constructor(status: number, message: string, code?: string, body?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

/**
 * Дедуп конкурентных рефрешей токена: если несколько запросов одновременно
 * ловят 401 (например дашборд параллельно грузит аккаунты и шаблоны, а
 * токен как раз протух между ними), не долбим Supabase несколькими
 * параллельными `refreshSession()` — все ждут ОДИН и тот же in-flight
 * промис.
 */
let refreshPromise: Promise<boolean> | null = null;

async function refreshSessionOnce(): Promise<boolean> {
  if (!refreshPromise) {
    const supabase = createClient();
    refreshPromise = supabase.auth
      .refreshSession()
      .then(({ data, error }) => !error && !!data.session)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/** Сессия окончательно мертва (рефреш не помог, либо помог, но и повторный
 * запрос всё равно словил 401) — разлогиниваем и уводим на /login, сохраняя
 * текущий путь через ?next= (та же санитайзация и тот же параметр, что уже
 * использует proxy.ts/логин — см. shared/lib/next-url.ts) и с пометкой
 * session_expired=1, чтобы /login показал "сессия истекла", а не голую
 * форму (см. app/login/page.tsx). Жёсткая навигация (не router.push) —
 * этот модуль не React-компонент, useRouter тут недоступен, а полный
 * сброс состояния приложения после смерти сессии — это уместное
 * поведение, не недостаток мягкого перехода. */
function redirectToLogin() {
  const next =
    typeof window !== "undefined"
      ? sanitizeNextPath(window.location.pathname + window.location.search)
      : null;
  const supabase = createClient();
  supabase.auth.signOut().finally(() => {
    const url = new URL("/login", window.location.origin);
    url.searchParams.set("session_expired", "1");
    if (next) url.searchParams.set("next", next);
    window.location.href = url.toString();
  });
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};
}

async function parseErrorBody(res: Response) {
  try {
    const json = await res.json();
    return {
      message: json.error || json.message || res.statusText,
      code: typeof json.code === "string" ? json.code : undefined,
      body: json,
    };
  } catch {
    // тело не JSON — оставляем statusText, без code/body
    return { message: res.statusText, code: undefined, body: undefined };
  }
}

async function request<T>(
  path: string,
  options?: RequestInit,
  isRetryAfterRefresh = false,
): Promise<T> {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...options?.headers,
    },
  });

  // 401 — токена нет/протух/невалиден. Один раз молча пробуем освежить
  // сессию и повторить ЭТОТ ЖЕ запрос; разлогиниваем в ДВУХ случаях:
  // (а) сам refreshSession() не помог (refresh-токен мёртв), или
  // (б) помог, но и повторный запрос ВСЁ РАВНО словил 401 (например бэкенд
  // отклонил уже per другой причине) — это и есть "если снова 401" из
  // задачи, раньше эта ветка ошибочно НЕ разлогинивала, просто пробрасывала
  // общую ApiError. isRetryAfterRefresh не даёt уйти в рекурсию больше
  // одного раза — на второй попытке этот if пропускается, и код падает
  // прямо в разлогин ниже.
  if (res.status === 401) {
    if (!isRetryAfterRefresh) {
      const refreshed = await refreshSessionOnce();
      if (refreshed) {
        return request<T>(path, options, true);
      }
    }
    redirectToLogin();
    // Страница уже уходит на /login. Возвращаем промис, который НИКОГДА
    // не резолвится (не throw/reject!) — вызывающий код в проекте часто
    // не оборачивает apiClient в try/catch (например `await getAccounts()`
    // прямо в useEffect на нескольких страницах дашборда), и reject без
    // catch сыпет "Uncaught (in promise)" в консоль браузера ровно в
    // момент, когда это уже не имеет значения — страница и так исчезает.
    // Зависший промис молча "замораживает" этот вызов до навигации, без
    // предупреждений.
    return new Promise<T>(() => {});
  }

  if (!res.ok) {
    const { message, code, body } = await parseErrorBody(res);
    throw new ApiError(res.status, message, code, body);
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
