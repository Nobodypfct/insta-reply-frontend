"use client";

import { useEffect, useState } from "react";
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
};

const REACTIONS = ["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂"];

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
}: PhonePreviewProps) {
  const avatarLetter = (username || "?").slice(0, 1).toUpperCase();

  const commentText =
    keywordMode === "specific" && keyword.trim()
      ? `А расскажите подробнее? ${keyword.split(",")[0].trim()}`
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
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-1 rounded-full border border-border-strong bg-surface p-1 text-xs">
        {(["Пост", "Комментарии", "Директ"] as const).map((label, i) => (
          <span
            key={label}
            className={`rounded-full px-3 py-1.5 transition-colors ${
              step === i
                ? "bg-accent-bg text-on-accent"
                : "text-secondary"
            }`}
          >
            {label}
          </span>
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
  if (loading) {
    return (
      <div className={`${className} animate-pulse rounded-full bg-white/10`} />
    );
  }
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
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
      <p className="border-b border-[#232D3A] py-3 text-center text-sm font-semibold text-white">
        Комментарии
      </p>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="flex gap-2.5">
          <div className="h-7 w-7 shrink-0 rounded-full bg-[#232D3A]" />
          <div className="flex-1 text-xs">
            <p className="text-white/90">
              <span className="font-medium">кто_то</span>{" "}
              <span className="text-white/40">сейчас</span>
            </p>
            <p className="mt-0.5 text-white/80">{commentText}</p>
            <p className="mt-1 text-white/30">Ответить</p>

            {/* ответ бота — вложенный reply, отступ + бордер слева, как в
                настоящем Instagram */}
            <AnimatePresence>
              {replyPhase !== "idle" && (
                <motion.div
                  key="bot-reply"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="mt-3 flex gap-2 border-l border-[#232D3A] pl-3"
                >
                  <AccountAvatar
                    letter={avatarLetter}
                    avatarUrl={avatarUrl}
                    loading={usernameLoading}
                    className="h-5 w-5 text-[9px]"
                  />
                  <div className="flex-1">
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
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex gap-2.5 px-3 pb-2 text-base">
        {REACTIONS.map((r) => (
          <span key={r}>{r}</span>
        ))}
      </div>

      <div className="flex items-center gap-2 px-3 pb-4">
        <div className="h-7 w-7 shrink-0 rounded-full bg-[#4F7CFF]" />
        <div className="flex-1 rounded-full border border-[#232D3A] bg-[#0B0F14] px-3 py-1.5 text-xs text-white/30">
          Комментарий…
        </div>
      </div>
    </div>
  );
}

type DMMessage = { text: string; button: string | null };
/** Один элемент отрисованной ленты DM: сообщение бота или синтетический
 * "клик по кнопке" от лица пользователя — чисто визуальная иллюстрация,
 * не связана с реальной логикой проверки подписки. */
type DMTimelineItem =
  | { kind: "bot"; text: string; button: string | null }
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
}) {
  const messages: DMMessage[] = requireFollowCheck
    ? [
        { text: dmText, button: buttonTextInitial },
        { text: messageIfNotFollowing, button: buttonTextFollowConfirm },
        { text: messageAfterFollow, button: null },
      ]
    : [{ text: dmText, button: null }];

  // Между сообщениями бота, у которых есть кнопка, вставляем "ответ
  // пользователя" — имитацию тапа по этой кнопке — чтобы превью читалось
  // как настоящий диалог, а не список карточек.
  const timeline: DMTimelineItem[] = [];
  for (const m of messages) {
    if (!m.text.trim()) continue;
    timeline.push({ kind: "bot", text: m.text, button: m.button });
    if (m.button && m.button.trim()) {
      timeline.push({ kind: "user", text: m.button.trim() });
    }
  }

  return (
    <div className="flex h-full flex-col bg-black pt-11 text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-2.5">
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

      <div className="flex flex-1 flex-col justify-end gap-3 overflow-y-auto px-4 py-4">
        {timeline.length > 0 ? (
          timeline.map((item, i) =>
            item.kind === "bot" ? (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.4, duration: 0.3, ease: "easeOut" }}
                className="flex max-w-[85%] flex-col items-start gap-1.5"
              >
                <div className="flex items-end gap-2">
                  <AccountAvatar
                    letter={avatarLetter}
                    avatarUrl={avatarUrl}
                    loading={usernameLoading}
                    className="h-6 w-6 text-[10px]"
                  />
                  <div className="whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-neutral-800 px-3.5 py-2.5 text-sm leading-relaxed text-white/90">
                    {item.text}
                  </div>
                </div>
                {item.button && (
                  <div className="ml-8 rounded-full border border-[#4F7CFF]/40 bg-[#4F7CFF]/10 px-3.5 py-1.5 text-xs font-medium text-[#4F7CFF]">
                    {item.button}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.4, duration: 0.3, ease: "easeOut" }}
                className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[#4F7CFF] px-3.5 py-2.5 text-sm leading-relaxed text-white"
              >
                {item.text}
              </motion.div>
            ),
          )
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
        <ImageIcon size={18} className="text-white/40" />
        <Smile size={18} className="text-white/40" />
        <Plus size={18} className="text-white/40" />
      </div>
    </div>
  );
}
