"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
} from "lucide-react";

export type PreviewStep = 0 | 1 | 2;

type PreviewPost = {
  thumbnailUrl?: string | null;
  caption?: string | null;
} | null;

type PhonePreviewProps = {
  step: PreviewStep;
  username: string;
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
      <p className="mb-6 text-sm text-[#7C8A9C]">Предпросмотр</p>

      <div className="relative h-[580px] w-[280px] overflow-hidden rounded-[42px] border-[6px] border-[#1B2430] bg-black">
        {/* статус-бар */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-11 items-center justify-between px-6 text-[11px] font-medium text-white">
          <span>15:44</span>
          <div className="flex items-center gap-1 opacity-70">
            <span className="h-2 w-2 rounded-full bg-white" />
            <span className="h-2 w-4 rounded-sm border border-white" />
          </div>
        </div>

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
                  avatarLetter={avatarLetter}
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
                        avatarLetter={avatarLetter}
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
                  avatarLetter={avatarLetter}
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

      <div className="mt-5 flex items-center gap-1 rounded-full border border-[#232D3A] bg-[#141B24] p-1 text-xs">
        {(["Пост", "Комментарии", "Директ"] as const).map((label, i) => (
          <span
            key={label}
            className={`rounded-full px-3 py-1.5 transition-colors ${
              step === i
                ? "bg-[#4F7CFF] text-white"
                : "text-[#7C8A9C]"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function PostScreen({
  username,
  avatarLetter,
  post,
  isAnyPost,
  showBottomNav,
}: {
  username: string;
  avatarLetter: string;
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
            {username || "аккаунт"}
          </p>
          <p className="text-sm font-semibold">Публикации</p>
        </div>
        <div className="w-[18px]" />
      </div>

      <div className="flex items-center gap-2 px-4 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#4F7CFF] text-[11px] font-semibold">
          {avatarLetter}
        </div>
        <span className="text-sm font-medium">{username || "аккаунт"}</span>
        <MoreHorizontal size={16} className="ml-auto text-white/40" />
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden bg-[#141B24]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="px-6 text-center">
            <ImageIcon className="mx-auto mb-2 text-white/20" size={30} />
            <p className="text-xs text-white/40">
              {isAnyPost ? "Сработает на любой пост" : "Выберите пост слева"}
            </p>
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
  avatarLetter,
  showReply,
  replyText,
}: {
  commentText: string;
  username: string;
  avatarLetter: string;
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
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#4F7CFF] text-[9px] font-semibold">
                    {avatarLetter}
                  </div>
                  <div className="flex-1">
                    <p className="text-white/90">
                      <span className="font-medium">
                        {username || "аккаунт"}
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

function DMScreen({
  username,
  avatarLetter,
  dmText,
  requireFollowCheck,
  buttonTextInitial,
  messageIfNotFollowing,
  buttonTextFollowConfirm,
  messageAfterFollow,
}: {
  username: string;
  avatarLetter: string;
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

  const visibleMessages = messages.filter((m) => m.text.trim());

  return (
    <div className="flex h-full flex-col pt-11 text-white">
      <div className="flex items-center gap-3 border-b border-[#141B24] px-4 py-2.5">
        <ChevronLeft size={18} className="text-white/70" />
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4F7CFF] text-xs font-semibold">
          {avatarLetter}
        </div>
        <span className="flex-1 text-sm font-medium">
          {username || "аккаунт"}
        </span>
        <Phone size={16} className="text-white/50" />
        <Video size={18} className="text-white/50" />
      </div>

      <div className="flex flex-1 flex-col justify-end gap-3 overflow-y-auto px-4 py-4">
        {visibleMessages.length > 0 ? (
          visibleMessages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.45, duration: 0.3, ease: "easeOut" }}
              className="flex max-w-[85%] flex-col items-start gap-1.5"
            >
              <div className="flex items-end gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4F7CFF] text-[10px] font-semibold">
                  {avatarLetter}
                </div>
                <div className="whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-[#232D3A] px-3.5 py-2.5 text-sm leading-relaxed text-white/90">
                  {m.text}
                </div>
              </div>
              {m.button && m.button.trim() && (
                <div className="ml-8 rounded-full border border-[#4F7CFF]/40 bg-[#4F7CFF]/10 px-3.5 py-1.5 text-xs font-medium text-[#4F7CFF]">
                  {m.button}
                </div>
              )}
            </motion.div>
          ))
        ) : (
          <p className="text-center text-xs text-white/30">
            Введите текст сообщения слева
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-[#141B24] px-3 py-3">
        <Camera size={18} className="text-[#4F7CFF]" />
        <div className="flex-1 rounded-full border border-[#232D3A] bg-[#141B24] px-3 py-1.5 text-xs text-white/30">
          Сообщение…
        </div>
        <ImageIcon size={18} className="text-white/40" />
        <Plus size={18} className="text-white/40" />
      </div>
    </div>
  );
}
