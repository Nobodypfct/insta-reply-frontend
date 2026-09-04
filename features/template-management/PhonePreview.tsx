"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Text } from "@astryxdesign/core/Text";
import {
  ChevronLeft,
  MoreHorizontal,
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Phone,
  Video,
  Camera,
  Image as ImageIcon,
  Plus,
  Home,
  Search,
  SquarePlus,
  Film,
  CircleUserRound,
  Wifi,
  Smile,
  Link as LinkIcon,
} from "lucide-react";

export type PreviewStep = 0 | 1 | 2;

type PreviewPost = {
  thumbnailUrl?: string | null;
  caption?: string | null;
} | null;

type PhonePreviewProps = {
  step: PreviewStep;
  username: string;
  usernameLoading?: boolean;
  /**
   * Реальная аватарка подключённого IG-аккаунта. На момент написания
   * backend её не отдаёт (см. TODO в dashboard/accounts/[id]/page.tsx) —
   * пропс подготовлен заранее, чтобы включить её было делом одной строчки,
   * когда/если API начнёт возвращать `avatar_url`. Пока всегда null —
   * везде используется буквенный fallback.
   */
  avatarUrl?: string | null;
  post: PreviewPost;
  isAnyPost: boolean;
  keyword: string;
  keywordMode: "specific" | "any";
  dmText: string;
  showReply: boolean;
  replyText: string;
  requireFollowCheck: boolean;
  buttonTextInitial: string;
  messageIfNotFollowing: string;
  buttonTextFollowConfirm: string;
  messageAfterFollow: string;
  /** Кнопка-ссылка под финальным сообщением — опциональна, независимо от
   * requireFollowCheck. Пустая строка = кнопки нет (тот же паттерн, что и
   * остальные button-поля: пустая = выключено, не отдельный boolean). */
  linkButtonText?: string;
  linkButtonUrl?: string;
  /** Клик по табу "Пост/Комментарии/Директ" под мокапом — управление шагом
   * визарда живёт в TemplateWizard (сам PhonePreview остаётся презентационным,
   * не знает про 4 шага формы, только про 3 экрана превью), поэтому наружу
   * отдаётся индекс таба, а не что-либо про сами шаги. Без пропа табы
   * остаются некликабельными (просто индикатор) — на случай будущего
   * read-only использования этого компонента. */
  onTabClick?: (tab: PreviewStep) => void;
};

const REACTIONS = ["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂"];

/**
 * Локальная палитра DM-мокапа (экран директа внутри рамки телефона) —
 * CSS custom properties, а НЕ Astryx-токены: этот файл — единственное
 * осознанное исключение из "только токены" (см. CLAUDE.md, раздел
 * "мокап телефона в визарде шаблонов"), он имитирует Instagram, а не наш
 * UI. Заведены как переменные (а не точечные `bg-[#хекс]` россыпью по
 * файлу), как и запрошено, но именно так, а не через JS-интерполяцию в
 * Tailwind-классы — Tailwind ищет `bg-[...]` как ЛИТЕРАЛЬНУЮ строку в
 * исходниках на этапе сборки, `bg-[${var}]` в рантайме он не увидит и
 * класс просто не сгенерирует. Поэтому: константы объявлены здесь для
 * читаемости и как источник истины, подключены через `style` на корневой
 * узел рамки (см. `data-astryx-theme="instagram-mock"` ниже), а в JSX
 * используются как `bg-[var(--chat-bg)]` — такая строка уже литеральна.
 */
const MOCKUP_COLORS = {
  "--chat-bg": "#121212",
  "--chat-header-bg": "#000000",
  "--chat-incoming-bg": "#262626",
  "--chat-incoming-text": "#f5f5f5",
  "--chat-quickreply-bg": "#333333",
  "--chat-quickreply-border": "rgba(255,255,255,0.15)",
  "--chat-outgoing-bg": "#5b52e8",
} as CSSProperties;

export function PhonePreview({
  step,
  username,
  usernameLoading = false,
  avatarUrl = null,
  post,
  isAnyPost,
  keyword,
  keywordMode,
  dmText,
  showReply,
  replyText,
  requireFollowCheck,
  buttonTextInitial,
  messageIfNotFollowing,
  buttonTextFollowConfirm,
  messageAfterFollow,
  linkButtonText = "",
  linkButtonUrl = "",
  onTabClick,
}: PhonePreviewProps) {
  const avatarLetter = (username || "?").slice(0, 1).toUpperCase();

  // Раньше было "А расскажите подробнее? {слово}" — убрана обрамляющая
  // фраза по прямому запросу, показываем ровно то, что юзер ввёл в поле
  // слова-триггера, без наших домыслов о том, как выглядел бы реальный
  // комментарий.
  const commentText =
    keywordMode === "specific" && keyword.trim()
      ? keyword.split(",")[0].trim()
      : "Очень круто, хочу себе такое же 🔥";

  return (
    <div className="flex flex-col items-center">
      <Text color="secondary" className="mb-6">
        Предпросмотр
      </Text>

      {/*
        data-astryx-theme на этой границе — не настоящая тема, а щит от
        протечки: theme.css заскоуплена через
        @scope([data-astryx-theme="insta-reply"]) to ([data-astryx-theme]),
        и ЛЮБОЙ элемент с data-astryx-theme (даже с посторонним именем)
        обрывает область действия внешней темы для всех потомков. Экран
        внутри рамки телефона намеренно имитирует Instagram и не должен
        краситься светлой темой приложения — см. задачу "полная миграция
        на Astryx", раздел про исключение для PhonePreview.
      */}
      <div
        data-astryx-theme="instagram-mock"
        style={MOCKUP_COLORS}
        className="relative h-[580px] w-[280px] overflow-hidden rounded-[42px] border-[6px] border-[#1B2430] bg-black"
      >
        {/* статус-бар — статичный элемент рамки, не часть анимируемого контента */}
        <StatusBar />

        <div className="absolute inset-0 overflow-hidden bg-[#0B0F14]">
          <AnimatePresence initial={false}>
            {step < 2 ? (
              <motion.div
                key="post-comments"
                className="absolute inset-0"
                initial={{ x: 0 }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <PostScreen
                  username={username}
                  usernameLoading={usernameLoading}
                  avatarLetter={avatarLetter}
                  avatarUrl={avatarUrl}
                  post={post}
                  isAnyPost={isAnyPost}
                  showBottomNav={step === 0}
                />
                <AnimatePresence>
                  {step === 1 && (
                    <motion.div
                      key="comments"
                      className="absolute inset-x-0 bottom-0 top-11"
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    >
                      <CommentsSheet
                        commentText={commentText}
                        username={username}
                        usernameLoading={usernameLoading}
                        avatarLetter={avatarLetter}
                        avatarUrl={avatarUrl}
                        showReply={showReply}
                        replyText={replyText}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="dm"
                className="absolute inset-0"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <DMScreen
                  username={username}
                  usernameLoading={usernameLoading}
                  avatarLetter={avatarLetter}
                  avatarUrl={avatarUrl}
                  dmText={dmText}
                  requireFollowCheck={requireFollowCheck}
                  buttonTextInitial={buttonTextInitial}
                  messageIfNotFollowing={messageIfNotFollowing}
                  buttonTextFollowConfirm={buttonTextFollowConfirm}
                  messageAfterFollow={messageAfterFollow}
                  linkButtonText={linkButtonText}
                  linkButtonUrl={linkButtonUrl}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/*
        "Пост" вернули обратно (было убрано, потом решили, что зря —
        см. переписку): "выбор поста" и "слово-триггер" по-прежнему один
        шаг формы (TemplateWizard.tsx), но у них РАЗНЫЕ секции превью —
        какая активна, реактивно решает сам TemplateWizard (по фокусу
        внутри соответствующей секции), не этот компонент. PhonePreview
        остаётся презентационным — просто получает готовый `step` и
        рисует нужный таб активным, не знает о секциях/фокусе вообще.
      */}
      <div className="mt-5 flex items-center gap-1 rounded-full border border-border-strong bg-surface p-1 text-xs">
        {(
          [
            { label: "Пост", previewStep: 0 },
            { label: "Комментарии", previewStep: 1 },
            { label: "Директ", previewStep: 2 },
          ] as const
        ).map(({ label, previewStep }) => (
          <button
            key={label}
            type="button"
            disabled={!onTabClick}
            onClick={() => onTabClick?.(previewStep)}
            className={`rounded-full px-3 py-1.5 transition-colors ${
              step === previewStep
                ? "bg-accent-bg text-on-accent"
                : `text-secondary ${onTabClick ? "hover:text-primary" : ""}`
            } ${onTabClick ? "cursor-pointer" : "cursor-default"}`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Статус-бар iOS — статичный элемент рамки телефона, живёт вне
 * анимируемого контента, поэтому не "прыгает" при смене шагов визарда.
 * Время намеренно захардкожено на "9:41" — стандарт индустрии для
 * мокапов (так делает и сама Apple в своих маркетинговых материалах).
 *
 * Раскладка на CSS grid (1fr / auto / 1fr): динамический остров занимает
 * СВОЙ трек по центру, а не абсолютно спозиционирован поверх остального —
 * поэтому он физически не может наехать на время слева или иконки справа,
 * при любой ширине мокапа.
 */
function StatusBar() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 grid h-11 grid-cols-[1fr_auto_1fr] items-center px-5">
      <span className="justify-self-start text-[15px] font-semibold tracking-tight text-white">
        9:41
      </span>

      {/* Dynamic Island — занимает собственную колонку грида */}
      <div className="h-[24px] w-[86px] justify-self-center rounded-full bg-black" />

      <div className="flex items-center justify-self-end gap-1">
        <SignalIcon />
        <Wifi size={14} strokeWidth={2.4} className="text-white" />
        <BatteryIcon />
      </div>
    </div>
  );
}

function SignalIcon() {
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" aria-hidden>
      <rect x="0" y="6" width="3" height="5" rx="0.8" fill="white" />
      <rect x="4.5" y="4" width="3" height="7" rx="0.8" fill="white" />
      <rect x="9" y="2" width="3" height="9" rx="0.8" fill="white" />
      <rect x="13.5" y="0" width="3" height="11" rx="0.8" fill="white" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="24" height="12" viewBox="0 0 24 12" fill="none" aria-hidden>
      <rect
        x="0.5"
        y="0.5"
        width="19.5"
        height="11"
        rx="3.2"
        stroke="white"
        strokeOpacity="0.4"
      />
      <rect x="2" y="2" width="14.5" height="8" rx="1.8" fill="white" />
      <rect
        x="21"
        y="4"
        width="1.6"
        height="4"
        rx="0.8"
        fill="white"
        fillOpacity="0.4"
      />
    </svg>
  );
}

/** Текст имени аккаунта со skeleton-состоянием на время загрузки. */
function AccountName({
  username,
  loading,
  skeletonWidth = "w-16",
}: {
  username: string;
  loading?: boolean;
  skeletonWidth?: string;
}) {
  if (loading) {
    return (
      <span
        className={`inline-block h-[1em] ${skeletonWidth} animate-pulse rounded bg-white/15 align-middle`}
      />
    );
  }
  return <>{username || "аккаунт"}</>;
}

/**
 * Аватар аккаунта: реальное фото, если есть `avatarUrl`, иначе буквенная
 * заглушка на акцентном фоне — и то и другое со skeleton-состоянием на
 * время загрузки. См. комментарий к `avatarUrl` в PhonePreviewProps.
 *
 * `brokenUrl` — URL Instagram отдаёт с TTL (протухает через какое-то
 * время), а бэкенд его периодически, но не мгновенно, обновляет — так что
 * иногда прилетит уже протухшая ссылка. Сравниваем именно со значением, а
 * не булевым флагом: если `avatarUrl` поменяется на новый (юзер обновил
 * аккаунт/бэкенд обновил кэш), это не "тот же" протухший URL — пробуем
 * загрузить заново, а не залипаем на заглушке навсегда.
 */
function AccountAvatar({
  letter,
  avatarUrl,
  loading,
  className,
}: {
  letter: string;
  avatarUrl?: string | null;
  loading?: boolean;
  className: string;
}) {
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);

  if (loading) {
    return (
      <div className={`${className} animate-pulse rounded-full bg-white/10`} />
    );
  }
  if (avatarUrl && avatarUrl !== brokenUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        onError={() => setBrokenUrl(avatarUrl)}
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-[#4F7CFF] font-semibold text-white`}
    >
      {letter}
    </div>
  );
}

function PostScreen({
  username,
  usernameLoading,
  avatarLetter,
  avatarUrl,
  post,
  isAnyPost,
  showBottomNav,
}: {
  username: string;
  usernameLoading?: boolean;
  avatarLetter: string;
  avatarUrl?: string | null;
  post: PreviewPost;
  isAnyPost: boolean;
  showBottomNav: boolean;
}) {
  const imageUrl = post?.thumbnailUrl || undefined;

  return (
    <div className="flex h-full flex-col pt-11 text-white">
      <div className="flex items-center gap-3 px-4 py-2">
        <ChevronLeft size={18} className="text-white/70" />
        <div className="flex-1 text-center">
          <p className="text-[10px] uppercase tracking-wide text-white/40">
            <AccountName
              username={username}
              loading={usernameLoading}
              skeletonWidth="w-14"
            />
          </p>
          <p className="text-sm font-semibold">Публикации</p>
        </div>
        <div className="w-[18px]" />
      </div>

      <div className="flex items-center gap-2 px-4 py-2">
        <AccountAvatar
          letter={avatarLetter}
          avatarUrl={avatarUrl}
          loading={usernameLoading}
          className="h-7 w-7 text-[11px]"
        />
        <span className="text-sm font-medium">
          <AccountName username={username} loading={usernameLoading} />
        </span>
        <MoreHorizontal size={16} className="ml-auto text-white/40" />
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden bg-[#141B24]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : isAnyPost ? (
          <div className="px-6 text-center">
            <ImageIcon className="mx-auto mb-2 text-white/20" size={30} />
            <p className="text-sm italic text-white/50">Любой пост</p>
            <p className="mt-1 text-xs text-white/30">
              сработает на любой новый комментарий
            </p>
          </div>
        ) : (
          <div className="px-6 text-center">
            <ImageIcon className="mx-auto mb-2 text-white/20" size={30} />
            <p className="text-xs text-white/40">Выберите пост слева</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 px-4 py-2.5 text-white/80">
        <Heart size={20} />
        <MessageCircle size={20} />
        <Send size={20} />
        <Bookmark size={20} className="ml-auto" />
      </div>

      {showBottomNav && (
        <div className="mt-auto flex items-center justify-between border-t border-[#141B24] px-6 py-3 text-white/60">
          <Home size={18} />
          <Search size={18} />
          <SquarePlus size={18} />
          <Film size={18} />
          <CircleUserRound size={18} />
        </div>
      )}
    </div>
  );
}

function CommentsSheet({
  commentText,
  username,
  usernameLoading,
  avatarLetter,
  avatarUrl,
  showReply,
  replyText,
}: {
  commentText: string;
  username: string;
  usernameLoading?: boolean;
  avatarLetter: string;
  avatarUrl?: string | null;
  showReply: boolean;
  replyText: string;
}) {
  const [replyPhase, setReplyPhase] = useState<"idle" | "typing" | "shown">(
    "idle",
  );

  useEffect(() => {
    if (!showReply) {
      setReplyPhase("idle");
      return;
    }
    setReplyPhase("typing");
    const timer = setTimeout(() => setReplyPhase("shown"), 700);
    return () => clearTimeout(timer);
  }, [showReply, replyText]);

  return (
    <div className="flex h-full flex-col rounded-t-2xl border-t border-[#232D3A] bg-[#141B24]">
      <div className="flex justify-center pt-2">
        <div className="h-1 w-9 rounded-full bg-[#3A4657]" />
      </div>
      {/* grid 1fr/auto/1fr — тот же приём, что и в StatusBar: заголовок
          остаётся ровно по центру независимо от ширины иконки справа,
          левая колонка — просто балансирующий пустой трек */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-[#232D3A] px-4 py-3">
        <span />
        <p className="text-center text-sm font-semibold text-white">
          Комментарии
        </p>
        <Send size={18} className="justify-self-end text-white" />
      </div>

      {/* min-h-0 обязателен: flex-элемент по умолчанию не может стать
          меньше содержимого (min-height: auto), даже с overflow-y-auto —
          без этой строчки контейнер просто раздувается и толкает рамку
          телефона, вместо того чтобы скроллиться внутри себя. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {/*
          Комментарий и ответ на него — ДВА НЕЗАВИСИМЫХ ряда одинаковой
          формы (аватар + текст + сердце), не вложенность одного в
          flex-1 другого. Раньше ответ был ребёнком text-колонки
          комментария — из-за этого его собственная ширина урезалась
          ДВАЖДЫ (сердцем комментария снаружи И своим же сердцем внутри),
          отсюда неправдоподобно узкий перенос текста и "съезжающее"
          сердце у ответа. Отступ pl-9 — визуальная имитация вложенности
          (под текстом комментария, не под его аватаром), без реальной
          вложенности в DOM.
        */}
        <div className="flex items-start gap-2.5">
          <div className="h-7 w-7 shrink-0 rounded-full bg-white/90" />
          <div className="flex-1 text-xs">
            <p className="text-white/90">
              <span className="font-medium">кто_то</span>{" "}
              <span className="text-white/40">сейчас</span>
            </p>
            <p className="mt-0.5 text-white/80">{commentText}</p>
            <p className="mt-1 text-white/30">Ответить</p>
          </div>
          <Heart size={14} className="mt-0.5 shrink-0 text-white/70" />
        </div>

        <AnimatePresence>
          {replyPhase !== "idle" && (
            <motion.div
              key="bot-reply"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mt-3 flex items-start gap-2 pl-9"
            >
              <AccountAvatar
                letter={avatarLetter}
                avatarUrl={avatarUrl}
                loading={usernameLoading}
                className="h-5 w-5 text-[9px]"
              />
              <div className="flex-1 text-xs">
                <p className="text-white/90">
                  <span className="font-medium">
                    <AccountName
                      username={username}
                      loading={usernameLoading}
                      skeletonWidth="w-12"
                    />
                  </span>{" "}
                  <span className="text-white/40">сейчас</span>
                </p>
                {replyPhase === "typing" ? (
                  <p className="mt-0.5 text-white/40">···</p>
                ) : (
                  <p className="mt-0.5 text-white/80">
                    {replyText || "Спасибо за комментарий 🙌"}
                  </p>
                )}
                <p className="mt-1 text-white/30">Ответить</p>
              </div>
              <Heart size={14} className="mt-0.5 shrink-0 text-white/70" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-2.5 px-3 pb-2 text-base">
        {REACTIONS.map((r) => (
          <span key={r}>{r}</span>
        ))}
      </div>

      <div className="flex items-center gap-2 px-3 pb-4">
        <AccountAvatar
          letter={avatarLetter}
          avatarUrl={avatarUrl}
          loading={usernameLoading}
          className="h-7 w-7 text-[11px]"
        />
        <div className="flex-1 rounded-full border border-[#232D3A] bg-[#0B0F14] px-3 py-1.5 text-xs text-white/30">
          Комментарий для{" "}
          <AccountName
            username={username}
            loading={usernameLoading}
            skeletonWidth="w-14"
          />
          …
        </div>
      </div>
    </div>
  );
}

type LinkButton = { text: string; url: string };
type DMMessage = {
  text: string;
  button: string | null;
  /** Кнопка-ссылка — концептуально ДРУГОЙ тип, чем `button` выше: та
   * триггерит следующее сообщение бота (см. синтетический "клик" ниже),
   * эта открывает URL напрямую и ничего дальше не вызывает — поэтому у
   * нее нет соответствующего "user"-элемента в таймлайне. */
  linkButton?: LinkButton | null;
};
/** Один элемент отрисованной ленты DM: сообщение бота или синтетический
 * "клик по кнопке" от лица пользователя — чисто визуальная иллюстрация,
 * не связана с реальной логикой проверки подписки. */
type DMTimelineItem =
  | { kind: "bot"; text: string; button: string | null; linkButton?: LinkButton | null }
  | { kind: "user"; text: string };

function DMScreen({
  username,
  usernameLoading,
  avatarLetter,
  avatarUrl,
  dmText,
  requireFollowCheck,
  buttonTextInitial,
  messageIfNotFollowing,
  buttonTextFollowConfirm,
  messageAfterFollow,
  linkButtonText,
  linkButtonUrl,
}: {
  username: string;
  usernameLoading?: boolean;
  avatarLetter: string;
  avatarUrl?: string | null;
  dmText: string;
  requireFollowCheck: boolean;
  buttonTextInitial: string;
  messageIfNotFollowing: string;
  buttonTextFollowConfirm: string;
  messageAfterFollow: string;
  linkButtonText?: string;
  linkButtonUrl?: string;
}) {
  // Кнопка-ссылка живёт только на финальном сообщении ("После подписки") —
  // см. задачу, там же и на референсе-скриншоте она появляется.
  const finalLinkButton: LinkButton | null =
    linkButtonText?.trim() && linkButtonUrl?.trim()
      ? { text: linkButtonText.trim(), url: linkButtonUrl.trim() }
      : null;

  const messages: DMMessage[] = requireFollowCheck
    ? [
        { text: dmText, button: buttonTextInitial },
        { text: messageIfNotFollowing, button: buttonTextFollowConfirm },
        { text: messageAfterFollow, button: null, linkButton: finalLinkButton },
      ]
    : [{ text: dmText, button: null }];

  // Между сообщениями бота, у которых есть кнопка, вставляем "ответ
  // пользователя" — имитацию тапа по этой кнопке — чтобы превью читалось
  // как настоящий диалог, а не список карточек.
  const timeline: DMTimelineItem[] = [];
  for (const m of messages) {
    if (!m.text.trim()) continue;
    timeline.push({
      kind: "bot",
      text: m.text,
      button: m.button,
      linkButton: m.linkButton,
    });
    if (m.button && m.button.trim()) {
      timeline.push({ kind: "user", text: m.button.trim() });
    }
  }

  return (
    <div className="flex h-full flex-col bg-[var(--chat-bg)] pt-11 text-white">
      <div className="flex items-center gap-3 border-b border-white/10 bg-[var(--chat-header-bg)] px-4 py-2.5">
        <ChevronLeft size={18} className="text-white/70" />
        <AccountAvatar
          letter={avatarLetter}
          avatarUrl={avatarUrl}
          loading={usernameLoading}
          className="h-8 w-8 text-xs"
        />
        <span className="flex-1 text-sm font-medium">
          <AccountName username={username} loading={usernameLoading} />
        </span>
        <Phone size={16} className="text-white/50" />
        <Video size={18} className="text-white/50" />
      </div>

      {/* min-h-0 — та же причина, что в CommentsSheet выше: без него
          flex-элемент с overflow-y-auto не скроллится, а раздувается. */}
      <div className="min-h-0 flex flex-1 flex-col justify-end gap-2.5 overflow-y-auto px-4 py-4">
        {timeline.length > 0 ? (
          timeline.map((item, i) => {
            // Аватар и "хвостик" — только у первого сообщения в серии
            // подряд идущих сообщений ОДНОГО отправителя, как в настоящем
            // Instagram: если предыдущий элемент ленты того же типа
            // (bot/user), это продолжение той же группы.
            const isFirstInGroup = i === 0 || timeline[i - 1].kind !== item.kind;

            return item.kind === "bot" ? (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.4, duration: 0.3, ease: "easeOut" }}
                className="flex max-w-[85%] items-end gap-2"
              >
                {isFirstInGroup ? (
                  <AccountAvatar
                    letter={avatarLetter}
                    avatarUrl={avatarUrl}
                    loading={usernameLoading}
                    className="h-6 w-6 text-[10px]"
                  />
                ) : (
                  <div className="h-6 w-6 shrink-0" />
                )}
                <div
                  className={`overflow-hidden rounded-2xl bg-[var(--chat-incoming-bg)] text-[var(--chat-incoming-text)] ${
                    isFirstInGroup ? "rounded-bl-sm" : ""
                  }`}
                >
                  <p className="whitespace-pre-wrap px-3.5 py-2.5 text-sm leading-relaxed">
                    {item.text}
                  </p>
                  {item.button && (
                    <div className="border-t border-[var(--chat-quickreply-border)] bg-[var(--chat-quickreply-bg)] px-3.5 py-2.5 text-center text-sm font-medium">
                      {item.button}
                    </div>
                  )}
                  {item.linkButton && (
                    <div className="flex items-center justify-center gap-1.5 border-t border-[var(--chat-quickreply-border)] bg-[var(--chat-quickreply-bg)] px-3.5 py-2.5 text-center text-sm font-medium">
                      <LinkIcon size={13} className="shrink-0" />
                      {item.linkButton.text}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.4, duration: 0.3, ease: "easeOut" }}
                className={`ml-auto max-w-[85%] rounded-2xl bg-[var(--chat-outgoing-bg)] px-3.5 py-2.5 text-sm leading-relaxed text-white ${
                  isFirstInGroup ? "rounded-br-sm" : ""
                }`}
              >
                {item.text}
              </motion.div>
            );
          })
        ) : (
          <p className="text-center text-xs text-white/30">
            Введите текст сообщения слева
          </p>
        )}
      </div>

      {/* нижняя панель ввода — статичный декор, не интерактивна */}
      <div className="flex items-center gap-2 border-t border-white/10 px-3 py-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#4F7CFF]">
          <Camera size={14} className="text-white" />
        </div>
        <div className="flex-1 rounded-full border border-white/10 bg-neutral-900 px-3 py-1.5 text-xs text-white/30">
          Сообщение…
        </div>
        <ImageIcon size={18} className="text-white/70" />
        <Smile size={18} className="text-white/70" />
        <Plus size={18} className="text-white/70" />
      </div>
    </div>
  );
}
