"use client";

import { useState } from "react";
import { RadioList, RadioListItem } from "@astryxdesign/core/RadioList";
import { Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { Banner } from "@astryxdesign/core/Banner";
import type { IgMedia } from "@/entities/ig-account/types";

type PostPickerProps = {
  media: IgMedia[];
  /** GET .../media вернул ошибку (обычно протухший IG-токен аккаунта) —
   * media в этом случае пустой массив, но пустой массив по ДРУГОЙ
   * причине ("у аккаунта правда нет постов") не должен показывать то же
   * самое сообщение — юзер решит, что нужно снять слово-триггер, а не
   * переподключить аккаунт. */
  mediaError?: boolean;
  scope: "post" | "any";
  selectedPostId: string | null;
  onScopeChange: (scope: "post" | "any") => void;
  onSelectPost: (postId: string) => void;
};

const VISIBLE_COUNT = 4;

export function PostPicker({
  media,
  mediaError = false,
  scope,
  selectedPostId,
  onScopeChange,
  onSelectPost,
}: PostPickerProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleMedia = showAll ? media : media.slice(0, VISIBLE_COUNT);

  return (
    <div>
      <RadioList
        label="Область действия"
        isLabelHidden
        value={scope}
        onChange={(v) => onScopeChange(v as "post" | "any")}
      >
        <RadioListItem label="конкретный пост или reels" value="post" />
        <RadioListItem label="любой пост или reels" value="any" />
      </RadioList>

      {scope === "post" && (
        <div className="mt-3">
          {mediaError ? (
            <Banner
              status="warning"
              title="Не удалось загрузить посты"
              description="Возможно, у аккаунта истёк доступ к Instagram — попробуйте переподключить его."
            />
          ) : media.length === 0 ? (
            <Text color="secondary" type="supporting">
              Посты не найдены.
            </Text>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2">
                {visibleMedia.map((m) => {
                  const thumb = m.thumbnail_url || m.media_url;
                  const selected = selectedPostId === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onSelectPost(m.id)}
                      className={`aspect-square overflow-hidden rounded-lg border-2 bg-body transition-colors ${
                        selected
                          ? "border-accent"
                          : "border-transparent hover:border-border-strong"
                      }`}
                    >
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={thumb}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Text color="secondary" type="supporting">
                            нет превью
                          </Text>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {!showAll && media.length > VISIBLE_COUNT && (
                <div className="mt-3">
                  <Link onClick={() => setShowAll(true)}>Показать все</Link>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
