# CLAUDE.md — insta-reply-frontend

@AGENTS.md

Читается Claude Code автоматически при старте в этой директории. Строка
`@AGENTS.md` выше — импорт файла, который автоматически генерирует/
обновляет сам Next.js при `next dev` (содержит предупреждения о
breaking changes конкретной версии Next.js относительно стандартного
API). Не удаляй эту строку — без неё Claude Code не увидит содержимое
AGENTS.md вообще, он не читается автоматически сам по себе.

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

## Кнопка-ссылка после подписки + навигация по превью

`TemplateWizard.tsx` (шаг 3, "Они получат") — опциональная кнопка-ссылка
под финальным сообщением (`messageAfterFollow`), включается своим Switch'ем
(`showLinkButton`, чисто UI-состояние, на бэкенд не уходит — наличие кнопки
определяется по непустым `linkButtonText`/`linkButtonUrl`, тем же паттерном,
что и остальные button-поля этого шага). Концептуально ДРУГОЙ тип кнопки,
чем `buttonTextInitial`/`buttonTextFollowConfirm`: те триггерят следующее
сообщение бота (в `PhonePreview` после клика — синтетический ответ юзера),
эта открывает URL напрямую и ничего дальше не вызывает — в `DMScreen`
(`PhonePreview.tsx`) у нее поэтому нет соответствующего `"user"`-элемента в
таймлайне, только нестандартный nested-блок под текстом с иконкой 🔗.

Поля `linkButtonText`/`linkButtonUrl` (`TemplateInput`) и
`link_button_text`/`link_button_url` (`Template`, `entities/template/
types.ts`) — backend их пока не хранит и не отдаёт, отправляются
forward-compatible (тот же паттерн, что `avatar_url` ниже) — бэкенд-таск
поставлен отдельным промптом.

Табы "Пост/Комментарии/Директ" под превью телефона — теперь кликабельны
(`PhonePreview`'s `onTabClick` проп, сам компонент остаётся презентационным
и не знает про 4 шага формы). Логика навигации — в `TemplateWizard.tsx`:
- назад — свободно, без валидации (шаг уже был пройден)
- вперёд — через `validateStep()` каждого промежуточного шага по очереди
  (как будто повторными кликами по "Далее"); на первом невалидном шаге
  останавливается и показывает его ошибку, дальше не пускает
- таб "Комментарии" визуально накрывает ДВА шага формы (1 — слово-триггер,
  2 — ответ на комментарий) — ведёт в НАЧАЛО этой группы (шаг 1), не в
  середину

ManyChat/ChatPlace (конкуренты) пускают вперёд без валидации вообще —
осознанно сделано строже для v1 (см. переписку), можно пересмотреть позже.

## Валидация форм — zod, без react-hook-form (пока)

`features/template-management/validation.ts` — схемы валидации визарда
(`zod`, единственная форм-related либа в проекте). Осознанно НЕ
`react-hook-form` поверх: Astryx-инпуты (`TextInput`/`TextArea`) имеют
нестандартную сигнатуру `onChange={(value, e) => ...}`, RHF's `register()`
с ней не работает "из коробки" — потребовался бы `Controller` на каждое
из ~12 полей визарда ради архитектурной чистоты, которая пока не нужна
(текущий per-field `useState` работает). Схемы вызываются вручную
(`schemaError()`), результат руками кладётся в `status` проп нужного
Astryx-инпута — тот уже умеет показывать ошибку под полем "из коробки".

**Если/когда понадобится RHF** — эти же схемы (без изменений) компонуются
в один `z.object({...})` и передаются в `zodResolver()`, переписывать
правила валидации не придётся, поменяется только то, как форма их
использует.

**Лимиты длины** (`DM_MESSAGE_MAX_LENGTH=500`, `COMMENT_REPLY_MAX_LENGTH=100`)
— не выдуманы и не из Instagram API, взяты по референсу конкурента
(ChatPlace). Заданы через `maxLength` на `TextArea` (там есть готовый
счётчик символов "из коробки" — `astryx docs`/`astryx component TextArea`)
и вручную дублируются в zod-схеме для реальной блокировки сабмита
(`maxLength` сам по себе ничего не enforce-ит, только показывает счётчик
— см. описание пропа). `TextInput` (в отличие от `TextArea`) `maxLength`
вообще не поддерживает — для однострочных полей (варианты ответа на
комментарий) есть только `status`-ошибка при превышении, без live-счётчика.

**`hasAttempted`** — общий на весь визард флаг, включается при первой
попытке продвинуться (Далее/таб/сабмит), навсегда. До него per-field
`status` не показывается (не пугаем пустым обязательным полем с первого
рендера), после — показывается живьём по мере правок.

## Типизация ошибок API — точечно, не общая система (пока)

`ApiError` (`shared/api/client.ts`) несёт опциональный `code?: string`
(из `json.code` тела ответа) — НЕ полноценная система типизированных
кодов/маппинга. Осознанное решение: во всём проекте пока всего 2
прецедента структурированной ошибки от бэкенда —

1. Конфликт при подключении Instagram (409, кастомный
   `{username, existingOwnerEmail}`, `app/instagram-connected/page.tsx`)
2. `any_post_template_exists` — конфликт "уже есть шаблон на любой пост"
   при создании шаблона (`TemplateWizard.tsx`, `ANY_POST_CONFLICT_CODE`)

Двух прецедентов недостаточно, чтобы обобщать (YAGNI) — оба обрабатываются
точечно, каждый своей веткой в своём компоненте, а не через общий
enum/маппинг код→текст. **Когда появится 3-й непохожий случай** — вот
тогда закономерность станет видна и обобщение будет обоснованным, а не
гаданием на два примера. Напоминание оставлено и в backend-репозитории
(см. промпт по `any_post_template_exists`) — тот же принцип должен
применяться и там.

## План: типы автоматизаций (не реализовано, только направление)

Сейчас у `Template` НЕТ дискриминатора типа — модель на 100% заточена под
единственный существующий флоу "комментарий → DM" (`post_id`,
`keyword`-на-комментарий, `template_replies`). 3 карточки-стартера на
`/dashboard` — пока рыба (см. коммент в `app/dashboard/page.tsx`), но
согласовано: реальных технических флоу будет ДВА, не три —
"Автоответ на комментарии" и "Собирайте лиды через комментарии" технически
один и тот же comment→DM механизм под разным маркетинговым текстом;
третий — "Отвечайте на все DM" — генуинно другой (триггер: входящее DM
сообщение/слово, без поста и комментария вообще).

Когда до этого дойдёт — понадобится (a) дискриминатор `type` в модели
`Template` на бэкенде (снова backend-координация, тот же паттерн, что
`avatar_url`/`link_button_*`), (b) отдельный wizard-компонент под DM-флоу
(шаги 0-2 текущего `TemplateWizard` — post/keyword/comment-reply —
DM-флоу не касаются вообще, переиспользовать почти нечего кроме
низкоуровневых `PhonePreview`-примитивов), (c) решение по роутам под
разные типы (сейчас единственный визард — оверлей внутри
`/dashboard/accounts/[id]`, не отдельный роут — см. "Гейт защищённых
страниц" выше, там же было решение пока роут не менять).

## Аватарка IG-аккаунта (`avatar_url`)

Фронтенд полностью готов отображать реальную аватарку подключённого
Instagram-аккаунта — карточки на `/dashboard/accounts` (через Astryx
`Avatar`, сам откатывается на инициалы при отсутствии/ошибке загрузки
`src`) и мокап телефона в визарде (`PhonePreview.tsx`'s `AccountAvatar` —
свой ручной `onError`-фолбэк на буквенную заглушку, т.к. это тёмный
Instagram-мокап вне Astryx). Пока везде показывает буквенный fallback —
бэкенд ещё не отдаёт `avatar_url` в `IgAccount` (см. `entities/ig-account/
types.ts`, поле опционально).

`profile_picture_url` Instagram отдаёт только ОДИН раз — во время самого
OAuth-подключения (эфемерная Auth.js-сессия, см. "Что НЕ делать"). Он уже
прокинут через `auth.ts` (`token.igProfilePictureUrl`/`session.
igProfilePictureUrl`, тот же паттерн, что `igAccessToken`) и отправляется
бэкенду полем `profile_picture_url` в теле `POST /api/complete-instagram-
connect` (`app/instagram-connected/page.tsx`) — бэкенд пока это поле
игнорирует, задача сохранить его и научиться отдавать обратно поставлена
отдельным промптом в бэкенд-репозиторий (см. переписку/таск-трекер, не
дублирую текст здесь).

## Гейт защищённых страниц (редиректы авторизации)

Двухслойная защита `/dashboard/**` и `/instagram-connected` — без клиентского
флэша формы логина/контента перед редиректом:

1. **`proxy.ts`** (корень проекта) — единая точка входа, ДО рендера
   страницы. В Next.js 16 файловая конвенция `middleware` переименована в
   `proxy` (тот же механизм — см. `node_modules/next/dist/docs/01-app/
   03-api-reference/03-file-conventions/proxy.md`), файл и экспортируемая
   функция должны называться именно `proxy.ts`/`proxy`, не
   `middleware.ts`/`middleware`. Использует `supabase.auth.getUser()` (не
   `getSession()` — та не валидирует JWT на сервере) через
   `lib/supabase-middleware.ts`, попутно тихо рефрешит протухший
   access-token.
   - Незалогиненный на `/dashboard/**` или `/instagram-connected` →
     `/login?next=<исходный путь+query>`
   - Залогиненный на `/login`, `/signup` или `/forgot-password` →
     `/dashboard`, либо на `?next=`, если он есть и прошёл санитайзинг
   - `/reset-password` сознательно НЕ входит ни в один из списков —
     туда ведёт ссылка восстановления пароля с уже легитимной (recovery)
     сессией; включить её в список "уводим залогиненного" — значит
     сломать сброс пароля.
   - `/api/**`, `/auth/confirm`, `/auth/callback` исключены через matcher —
     Auth.js и одноразовые auth-токены живут своей жизнью.

2. **Серверная перепроверка** на границе разделов —
   `app/dashboard/layout.tsx` и `app/instagram-connected/layout.tsx` (оба
   — server component, делают свой `getUser()` через
   `lib/supabase-server.ts` и `redirect("/login")` при отсутствии сессии).
   Это не дублирование ради дублирования: по официальной рекомендации
   Supabase для Next.js `proxy`/`middleware` — не единственная граница
   доверия, Server Component должен сам перепроверить сессию перед
   рендером чувствительных данных. `app/dashboard/layout.tsx` из-за этого
   раскладки: раньше был одним клиентским компонентом, сейчас сам layout —
   server component (только гейт + передача `email` пропом), вся
   UI-логика (сайдбар, `usePathname`, logout) — в
   `app/dashboard/DashboardShell.tsx`.

   Из-за этих двух слоёв клиентские `useEffect` + `getUser()` +
   `router.push("/login")` guard'ы, раньше независимо продублированные на
   `dashboard/page.tsx`, `dashboard/accounts/page.tsx` и
   `instagram-connected/page.tsx`, убраны — если этим страницам всё равно
   нужен `user.id` для данных, `getUser()` там остаётся, но без
   редирект-ветки (сюда без сессии физически не попасть).

3. **`next` — параметр для возврата на исходный урл** после логина/
   регистрации (переиспользует уже существующее имя параметра из
   `auth/confirm`/`auth/callback`, не `redirect`). Санитайзится ОБЯЗАТЕЛЬНО
   через `shared/lib/next-url.ts` (`sanitizeNextPath` — только
   относительный путь, без `//`/`://`) — и в `proxy.ts`, и повторно на
   `/login`/`/signup`/`/forgot-password`, потому что на эти страницы можно
   попасть и напрямую по ссылке с произвольным `?next=`, минуя `proxy.ts`
   же и сгенерированные им редиректы. Прокидывается через
   перекрёстные ссылки `/login` ↔ `/signup` ↔ `/forgot-password` и через
   `emailRedirectTo` писем подтверждения — иначе если незалогиненного увело
   с `?next=` на `/login`, а он ушёл регистрироваться, целевой урл
   терялся бы уже на этом шаге.

**ГРАБЛИ (уже наступили один раз): OAuth-логин (Google/Facebook) ОБЯЗАН
идти через `/auth/callback`, не напрямую на `/dashboard`.** `signInWithOAuth`
использует PKCE — Supabase редиректит браузер на `redirectTo` с `?code=...`
в query, и код нужно ОБМЕНЯТЬ на сессию (`exchangeCodeForSession`) ДО того,
как запрос попадёт на защищённую страницу. До появления `proxy.ts` это
шатко работало и с `redirectTo: "/dashboard"` — клиентский Supabase-клиент
сам подхватывал `?code=` из URL и обменивал его в браузере, а страница уже
успевала отрендериться. После `proxy.ts` это стало ломаться постоянно:
`proxy.ts` видит `/dashboard?code=...` БЕЗ сессии (cookie ещё не
установлена — обмен ещё не произошёл) раньше, чем клиентский JS вообще
успевает загрузиться, и редиректит на `/login`, теряя одноразовый (!) code.
Правильно — `redirectTo` у OAuth ведёт на `/auth/callback?next=...`
(обмен на сервере, в самом роуте, который поэтому и исключён из matcher'а
`proxy.ts`), а уже `/auth/callback` редиректит дальше на `next` с готовой
cookie. См. `app/login/page.tsx`/`app/signup/page.tsx` (`handleOAuth`) и
комментарий в `app/auth/callback/route.ts`.

## Bearer-токен к бэкенд-API (`shared/api/client.ts`)

Раньше `apiClient` вообще не слал `Authorization`, а бэкенд доверял
`user_id`, приходившему в query/body от клиента (см. `git log` — этот файл
раньше был почти голым fetch-wrapper'ом). Бэкенд (`ig-autoresponder`,
отдельный репозиторий) закрыл ВСЕ `/api/*` аутентификацией и больше не
принимает `user_id` откуда-либо — личность юзера только из токена.

- **Заголовок добавляется в одном месте** — `request()` внутри
  `shared/api/client.ts`, на каждый вызов заново берёт свежий
  `session.access_token` через `supabase.auth.getSession()` (браузерный
  клиент, `lib/supabase.ts`) — не кэшируется, `supabase-js` сам рефрешит
  токен по сроку жизни.
- **`user_id` убран** из `getAccounts()` (`entities/ig-account/api.ts` —
  функция больше не принимает параметр, вызовы `getAccounts(userId)` по
  всем 3 местам обновлены на `getAccounts()`) и из тела
  `complete-instagram-connect`.
- **`completeInstagramConnect()`** — раньше это был сырой `fetch()` прямо
  в `app/instagram-connected/page.tsx`, нарушавший собственное правило
  проекта "CRUD живёт в entities/*/api.ts". Перенесён в
  `entities/ig-account/api.ts`, теперь идёт через `apiClient` — получает
  Bearer-токен и 401-обработку бесплатно, а не точечным дублированием.
- **`ApiError.body`** — новое поле, полный распарсенный JSON ответа (не
  только `message`/`code`). Понадобилось из-за `complete-instagram-connect`:
  409-конфликт владельца аккаунта несёт свои поля (`username`,
  `existingOwnerEmail`), которые `message`/`code` не покрывают.
- **401 (`{code: "unauthorized"}`)** — обрабатывается ЦЕНТРАЛИЗОВАННО
  внутри `request()`, не в местах вызова: один раз молча
  `supabase.auth.refreshSession()`, если получилось — тот же запрос
  повторяется автоматически; если нет — `supabase.auth.signOut()` +
  жёсткий редирект на `/login?next=<текущий путь>` (`window.location.href`,
  не `router.push` — этот модуль не React-компонент, `useRouter`
  недоступен; полный сброс состояния приложения после смерти сессии тут
  уместен, не баг). Конкурентные 401 (несколько параллельных запросов
  ловят протухший токен одновременно) дедуплицируются — один и тот же
  in-flight `refreshSession()`-промис на всех, не параллельные рефреши.
- **403 (`{code: "forbidden"}`)** — специальной обработки нет,
  осознанно (см. "Типизация ошибок API" выше, тот же принцип): всплывает
  обычным `ApiError`, по брифу бэкенда в норме при корректном UI не
  возникает вообще.
- **ГРАБЛИ, требуют ручной проверки, сам не могу**: `.env.local` →
  `NEXT_PUBLIC_API_URL=http://localhost:3000` — это порт САМОГО
  фронтенда, не бэкенда, точно неверно для локальной разработки этой
  фичи. И CORS — бэкенд принимает только один сконфигурированный origin
  (`FRONTEND_URL` на его стороне) — свериться, что задеплоенный домен
  фронтенда (и локальный порт бэкенда для dev) там прописаны верно, я
  этого со своей стороны проверить не могу (отдельный репозиторий).

## Архитектура (лайтовая FSD, без переусложнения)

Мигрируем к этой структуре постепенно, не всё сразу:

```
app/                          — ТОЛЬКО роутинг Next.js, тонкие страницы
  login/page.tsx
  signup/page.tsx              (отдельно от /login, не режим внутри одной страницы)
  forgot-password/page.tsx
  reset-password/page.tsx
  dashboard/layout.tsx          — AppShell + сайдбар, общий для /dashboard и /dashboard/accounts/*
  dashboard/page.tsx
  dashboard/accounts/[id]/page.tsx
  instagram-connected/page.tsx
  api/auth/[...nextauth]/route.ts
  auth/confirm/route.ts

theme/
  custom-theme.ts               — кастомная Astryx-тема (см. "Дизайн-система" ниже)

shared/
  components/                 — переиспользуемые "глупые" UI-компоненты —
                                 ТОЛЬКО наши повторяющиеся паттерны поверх
                                 примитивов Astryx (например ActiveStatusBadge —
                                 маппинг boolean → Badge), не обёртки вокруг
                                 самих примитивов Astryx (Button/TextInput/Card
                                 и т.п. используем напрямую)
  api/client.ts                — базовый fetch-wrapper к нашему Express-бэкенду
                                 (NEXT_PUBLIC_API_URL, обработка ошибок в одном месте)
  lib/supabase.ts              — Supabase browser client

entities/                     — модели данных + запросы к ним по сущностям
  ig-account/{types.ts, api.ts}   — getAccounts(), getMedia()
  template/{types.ts, api.ts}     — CRUD шаблонов

features/                     — юзер-сценарии (форма + локальная логика действия)
  template-management/{TemplateWizard, PostPicker, PhonePreview}.tsx
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

## Дизайн-система — Astryx, светлая тема

Весь UI (кроме одного явного исключения ниже) — на компонентах
[Astryx](https://astryx.atmeta.com) (`@astryxdesign/core`), открытой
дизайн-системе от Meta (React 19 + StyleX). Светлая тема,
**никаких захардкоженных hex-цветов** — только токены темы.

- **Провайдер**: `components/AstryxProvider.tsx`, подключён в корневом
  `app/layout.tsx` (оборачивает всё приложение), `mode="light"` явно —
  не полагаемся на системную тему ОС.
- **Кастомная тема**: `theme/custom-theme.ts` — `defineTheme({ extends:
  neutralTheme, tokens: {...} })` поверх `@astryxdesign/theme-neutral`.
  У голой `neutralTheme` акцент монохромный (почти чёрный/белый — тема
  так и называется, "neutral"). Мы переопределяем `--color-accent`,
  `--color-text-accent`, `--color-icon-accent` на `var(--color-text-blue)`
  — это РЕАЛЬНЫЙ токен темы (готовый синий из её hue-палитры), не
  выдуманный hex. Тот же приём (`var()`-ссылка на другой токен), которым
  сама `theme-neutral` пользуется внутри для своего `variant:accent`.
  **Тема ОБЯЗАНА быть собранной (`astryx theme build`), не рантайм-`defineTheme`
  напрямую** — иначе FOUC на каждой загрузке (см. ниже).

  `theme/custom-theme.ts` — исходник (редактируется руками). Собранные
  артефакты — `theme/custom-theme.css` + `theme/insta-reply.{js,d.ts,
  variants.d.ts}` — генерируются командой, коммитятся в репозиторий
  (`next build` их сам не пересобирает):

  ```bash
  nvm use v24.7.0   # CLI требует Node ≥ 22.13
  npx astryx theme build theme/custom-theme.ts -o theme/custom-theme.css
  ```

  `AstryxProvider.tsx` импортирует `instaReplyTheme` из
  `theme/insta-reply.js` (НЕ `customTheme` из `custom-theme.ts` напрямую),
  `app/globals.css` статически импортирует `theme/custom-theme.css` в
  правильном слое (`@layer astryx-theme`, там же где раньше сидел
  `theme-neutral/theme.css`). После любой правки `custom-theme.ts` —
  пересобери командой выше и закоммить все сгенерированные файлы.

  **Почему это критично (FOUC-баг, было исправлено)**: `astryx.css`
  (общий для всех тем, статический, всегда в SSR) сам объявляет дефолтные
  токены на голом `:root` — например `--color-accent: #0064E0`
  (светло-синий, "no theme" вид Astryx). Наша тема должна переопределить
  это НАШИМ `#00458c` под `[data-astryx-theme="insta-reply"]`. Если этот
  override — несобранный `defineTheme(...)`, `<Theme>` красит его через
  `useInsertionEffect`, который выполняется ТОЛЬКО НА КЛИЕНТЕ ПОСЛЕ
  ГИДРАТАЦИИ: SSR и первый пейнт получают дефолт Astryx, и через мгновение
  после гидратации страница видимо перекрашивается — кнопки, фон и т.д.
  Собранная тема (`__built: true`) полностью пропускает эту рантайм-инъекцию
  — `<Theme>` только выставляет `data-astryx-theme`, а сам CSS уже приехал
  статическим `<link>`/бандлом с первого пейнта.
- **Токены**: перед тем как хардкодить цвет/отступ — проверяй
  `npx astryx docs tokens` (полный список) и `npx astryx component <Name>`
  (API конкретного компонента). Не выдумывай hex "на глаз". Если для
  чего-то реально нет подходящего токена — это повод спросить, а не
  придумывать значение самостоятельно.
- **CLI требует Node ≥ 22.13** (у нас в `nvm` есть `v24.7.0` — переключайся
  на него: `nvm use v24.7.0`), а сам `next build`/`next dev` — Node ≥ 20.9
  (`package.json` engines у `next`). Если сборка падает с жалобой на
  версию Node — это оно, не баг в коде.
- **Google-логотип** на `/login` (`app/login/page.tsx`) — единственное
  осознанное исключение из "только токены": это официальный многоцветный
  SVG-ассет Google (гайдлайны Google Identity для кнопки "Войти через
  Google"), не наш цвет дизайн-системы.

### ИСКЛЮЧЕНИЕ — мокап телефона в визарде шаблонов

`features/template-management/PhonePreview.tsx` — экран ВНУТРИ рамки
iPhone (статус-бар, посты/комментарии/DM) **намеренно тёмный** и не
мигрирован на Astryx: он имитирует реальный интерфейс Instagram, а не
наш UI. Технически это обеспечено атрибутом
`data-astryx-theme="instagram-mock"` на корневом узле рамки телефона —
Astryx theme CSS заскоуплена через
`@scope([data-astryx-theme="insta-reply"]) to ([data-astryx-theme])`, и
ЛЮБОЙ вложенный `data-astryx-theme` (даже с посторонним именем) обрывает
область действия внешней темы для потомков. Не убирай этот атрибут —
без него светлая тема "протечёт" в мокап (уже бывало похожим образом с
`<h1>` до того, как это исправили). Всё, что физически СНАРУЖИ рамки
телефона (подпись "Предпросмотр", шаг-индикатор под мокапом,
сама форма визарда слева) — обычный светлый Astryx UI, мигрировано как
и всё остальное.

## Что НЕ делать

- не смешивай Supabase Auth сессию с Auth.js сессией — это разные системы,
  `useSession()` (Auth.js) не знает о юзере кабинета, `supabase.auth.getUser()`
  не знает о подключении Instagram
- не убирай `trustHost: true` из `auth.ts`
- перед любым пушем гоняй `npm run build` — часть багов вылезает только на
  сборке, не в dev-режиме
