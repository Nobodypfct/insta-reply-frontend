"use client";

import { useState } from "react";
import type { IgMedia } from "@/entities/ig-account/types";

type PostPickerProps = {
  media: IgMedia[];
  scope: "post" | "any";
  selectedPostId: string | null;
  onScopeChange: (scope: "post" | "any") => void;
  onSelectPost: (postId: string) => void;
};

const VISIBLE_COUNT = 4;

export function PostPicker({
  media,
  scope,
  selectedPostId,
  onScopeChange,
  onSelectPost,
}: PostPickerProps) {
  const [showAll, setShowAll] = useState(false);
  const visibleMedia = showAll ? media : media.slice(0, VISIBLE_COUNT);

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#232D3A] bg-[#141B24] p-4">
        <input
          type="radio"
          checked={scope === "post"}
          onChange={() => onScopeChange("post")}
          className="mt-0.5 accent-[#4F7CFF]"
        />
        <div className="flex-1">
          <p className="text-sm font-medium text-[#E7ECF2]">
            конкретный пост или reels
          </p>

          {scope === "post" && (
            <div className="mt-3">
              {media.length === 0 ? (
                <p className="text-xs text-[#7C8A9C]">Посты не найдены.</p>
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
                          className={`aspect-square overflow-hidden rounded-lg border-2 bg-[#0B0F14] transition-colors ${
                            selected
                              ? "border-[#4F7CFF]"
                              : "border-transparent hover:border-[#232D3A]"
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
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-[#7C8A9C]">
                              нет превью
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {!showAll && media.length > VISIBLE_COUNT && (
                    <button
                      type="button"
                      onClick={() => setShowAll(true)}
                      className="mt-3 text-xs text-[#4F7CFF] hover:underline"
                    >
                      Показать все
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </label>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#232D3A] bg-[#141B24] p-4">
        <input
          type="radio"
          checked={scope === "any"}
          onChange={() => onScopeChange("any")}
          className="accent-[#4F7CFF]"
        />
        <p className="text-sm font-medium text-[#E7ECF2]">
          любой пост или reels
        </p>
      </label>
    </div>
  );
}
