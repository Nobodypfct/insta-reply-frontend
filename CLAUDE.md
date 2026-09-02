# CLAUDE.md — insta-reply-frontend

Читается Claude Code автоматически при старте в этой директории.

## Что это за проект

Next.js фронтенд для Insta-Reply. Личный кабинет: регистрация/вход,
подключение Instagram-аккаунта, управление шаблонами автоответов.

## Стек

- Next.js 15+ (App Router, Turbopack)
- Supabase Auth — для входа в САМ КАБИНЕТ (email/пароль, Google, Facebook)
- Auth.js (next-auth v5, beta) — ТОЛЬКО для OAuth-подключения Instagram
  аккаунта клиента. Это ДВЕ РАЗНЫЕ auth-системы, не путать.
- Tailwind CSS
- Хостинг: Vercel

## Архитектура / роуты

```
app/
  login/page.tsx                   — вход/регистрация/восстановление пароля
  auth/confirm/route.ts            — обработка ссылок из писем Supabase
                                      (token_hash подход, НЕ PKCE — см. ниже)
  reset-password/page.tsx          — форма нового пароля
  dashboard/page.tsx               — список подключённых IG-аккаунтов
  dashboard/accounts/[id]/page.tsx — управление шаблонами конкретного аккаунта
  instagram-connected/page.tsx     — обработчик после успешного Instagram OAuth
  api/auth/[...nextauth]/route.ts  — Auth.js route handler
auth.ts                            — конфиг Auth.js с кастомным Instagram
                                      провайдером
```

## Команды

```bash
npm install
npm run dev      # локальная разработка
npm run build    # проверка сборки перед деплоем — ВСЕГДА гоняй перед пушем
```

## КРИТИЧЕСКИ ВАЖНЫЕ грабли Instagram OAuth (весь день был потрачен на это)

1. **Встроенный провайдер `next-auth/providers/instagram` НЕЛЬЗЯ использовать
   как есть** — он написан под старый, устаревший Instagram Basic Display
   API. Мы используем КАСТОМНЫЙ провайдер (см. `auth.ts`) с `customFetch`.

2. **`token.request` в Auth.js v5 не работает** — задокументированный баг
   библиотеки (GitHub issue, сентябрь 2025), кастомная функция `request()`
   тихо игнорируется, вызывается дефолтный запрос. Используй `customFetch`
   (символ-экспорт из `next-auth`) вместо `token.request`.

3. **Instagram не присылает `token_type`** в ответе обмена кода на токен —
   `oauth4webapi` (внутренности Auth.js) строго валидирует это поле и падает
   с "not a conform Token Endpoint response". Решается через `customFetch`,
   который вручную конструирует правильный `Response`.

4. **`clientSecret` не передаётся автоматически** для кастомных провайдеров —
   конвенция `AUTH_INSTAGRAM_ID`/`AUTH_INSTAGRAM_SECRET` работает только для
   встроенных провайдеров. Передавай явно:

   ```ts
   InstagramProvider({
     clientId: process.env.AUTH_INSTAGRAM_ID,
     clientSecret: process.env.AUTH_INSTAGRAM_SECRET,
   });
   ```

5. **`trustHost: true` обязателен** на Vercel/за любым прокси — без этого
   падает с невнятным `TypeError: Invalid URL`.

6. **Authorize endpoint**: используй `https://www.instagram.com/oauth/authorize`
   с `force_reauth: 'true'` — это подтверждённо рабочая комбинация (сверено
   с официальным Embed URL из meta developers). НЕ `api.instagram.com` для
   authorize (для token exchange — наоборот, `api.instagram.com`, разные
   домены для разных шагов).

7. **Scope** должен ТОЧНО совпадать с тем, что реально включено в
   Permissions and features в meta developers — имена вида
   `instagram_manage_comments` vs `instagram_business_manage_comments`
   отличаются, и несовпадение даёт "Invalid platform app" (обманчивая
   ошибка, на самом деле про scope/app_id, не про redirect_uri).

## Supabase Auth — важные детали

1. **Используем `token_hash` + `verifyOtp`, НЕ PKCE `exchangeCodeForSession`**
   для email-ссылок (подтверждение регистрации, восстановление пароля).
   PKCE привязан к куки конкретного браузера — если юзер откроет письмо на
   другом устройстве, обмен кода упадёт. `token_hash` работает кросс-девайсно.

2. Email-шаблоны в Supabase Dashboard нужно вручную поправить на:

   ```
   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup&next=/dashboard
   ```

   (для Reset Password: `type=recovery&next=/reset-password`)
   Дефолтный `{{ .ConfirmationURL }}` использует PKCE — не подходит.

3. **SMTP**: встроенный email-сервис Supabase даёт 2 письма/час — этого
   хватает только на единичный тест. Подключён MailerSend через
   Project Settings → Authentication → SMTP Settings.

4. **`identities.length === 0`** в ответе `signUp()` — способ определить,
   что email уже зарегистрирован и подтверждён (Supabase не даёт явную
   ошибку по соображениям безопасности). НЕ ловит случай "зарегистрирован,
   но email ещё не подтверждён" — это отдельная ветка (ошибка
   `email_not_confirmed` при попытке логина).

## Архитектура (лайтовая FSD, без переусложнения)

Мигрируем к этой структуре постепенно, не всё сразу:

```
app/                          — ТОЛЬКО роутинг Next.js, тонкие страницы
  login/page.tsx
  signup/page.tsx              (отдельно от /login, не режим внутри одной страницы)
  forgot-password/page.tsx
  dashboard/page.tsx
  dashboard/accounts/[id]/page.tsx
  instagram-connected/page.tsx
  api/auth/[...nextauth]/route.ts
  auth/confirm/route.ts

shared/
  components/                 — переиспользуемые "глупые" UI-компоненты
                                 (Button, Input, Card, Modal, Badge)
  api/client.ts                — базовый fetch-wrapper к нашему Express-бэкенду
                                 (NEXT_PUBLIC_API_URL, обработка ошибок в одном месте)
  lib/supabase.ts              — Supabase browser client
  config/tokens.ts             — дизайн-токены (см. раздел "Дизайн-система" ниже)

entities/                     — модели данных + запросы к ним по сущностям
  ig-account/{types.ts, api.ts}   — getAccounts(), connectAccount(), getMedia()
  template/{types.ts, api.ts}     — CRUD шаблонов

features/                     — юзер-сценарии (форма + локальная логика действия)
  auth/{LoginForm, SignupForm, ForgotPasswordForm}.tsx
  instagram-connect/{ConnectButton, OwnerConflictModal}.tsx
  template-management/{TemplateForm, PostPicker}.tsx
```

**Правила:**

- `app/*/page.tsx` не должен содержать `fetch()` напрямую — вызывай через
  `entities/*/api.ts`, которые используют `shared/api/client.ts`.
- CSS отдельно не заводим — Tailwind-классы инлайн в JSX, это уже "рядом
  с компонентом" по своей природе.
- НЕ добавляем `widgets/`/`pages/` слои классического FSD, пока проект
  не разрастётся настолько, что тонкие `app/*/page.tsx` перестанут
  справляться сами по себе с композицией нескольких features на одной странице.
- CRUD-запросы (`fetch` к `/api/ig-accounts`, `/api/templates` и т.д.)
  живут в `entities/*/api.ts`, не размазаны по компонентам.

Тёмная тема, фон `#0B0F14`, карточки `#141B24`, границы `#232D3A`,
акцент `#4F7CFF`, текст вторичный `#7C8A9C`/`#9AA7B5`, успех `#22C55E`,
ошибка `#F87171`, предупреждение `#F59E0B`. Скруглённые углы (`rounded-lg`/
`rounded-xl`), без теней, минималистично.

## Что НЕ делать

- не смешивай Supabase Auth сессию с Auth.js сессией — это разные системы,
  `useSession()` (Auth.js) не знает о юзере кабинета, `supabase.auth.getUser()`
  не знает о подключении Instagram
- не убирай `trustHost: true` из `auth.ts`
- перед любым пушем гоняй `npm run build` — часть багов вылезает только на
  сборке, не в dev-режиме
