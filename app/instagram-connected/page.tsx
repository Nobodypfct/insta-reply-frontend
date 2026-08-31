"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { createClient } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function InstagramConnectedPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [message, setMessage] = useState("Завершаем подключение…");
  const [conflict, setConflict] = useState<{
    username: string;
    existingOwnerEmail: string;
  } | null>(null);
  const [transferring, setTransferring] = useState(false);

  async function completeConnect(forceTransfer: boolean) {
    const s = session as any;
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/login");
      return;
    }

    const res = await fetch(`${API_URL}/api/complete-instagram-connect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: data.user.id,
        long_lived_token: s.igAccessToken,
        force_transfer: forceTransfer,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      router.push(`/dashboard?connected=${json.username}`);
      return;
    }

    if (res.status === 409) {
      const json = await res.json();
      setConflict({
        username: json.username,
        existingOwnerEmail: json.existingOwnerEmail,
      });
      return;
    }

    router.push("/dashboard?connect_error=backend_failed");
  }

  useEffect(() => {
    if (status === "loading") return;

    const s = session as any;
    if (!s?.igAccessToken) {
      setMessage("Не удалось получить данные Instagram. Попробуйте снова.");
      setTimeout(
        () => router.push("/dashboard?connect_error=no_session"),
        1500,
      );
      return;
    }

    completeConnect(false);
  }, [status]);

  async function handleConfirmTransfer() {
    setTransferring(true);
    await completeConnect(true);
  }

  if (conflict) {
    return (
      <main className="min-h-screen bg-[#0B0F14] text-[#E7ECF2] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-[#232D3A] bg-[#141B24] p-6">
          <h1 className="text-base font-semibold mb-3">
            Аккаунт уже подключён
          </h1>
          <p className="text-sm text-[#9AA7B5] leading-relaxed mb-6">
            Аккаунт{" "}
            <strong className="text-[#E7ECF2]">@{conflict.username}</strong>{" "}
            привязан к проекту пользователя{" "}
            <strong className="text-[#E7ECF2]">
              {conflict.existingOwnerEmail}
            </strong>
            . При переносе аккаунт и все его автоматизации будут удалены из
            старого проекта и подключены к текущему.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex-1 rounded-lg border border-[#232D3A] text-sm text-[#9AA7B5] py-2.5 hover:text-[#E7ECF2] transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleConfirmTransfer}
              disabled={transferring}
              className="flex-1 rounded-lg bg-[#4F7CFF] hover:bg-[#3D68EA] disabled:opacity-50 transition-colors text-white text-sm font-medium py-2.5"
            >
              {transferring ? "Переносим…" : "Перенести аккаунт"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0B0F14] text-[#E7ECF2] flex items-center justify-center">
      <p className="text-sm text-[#7C8A9C]">{message}</p>
    </main>
  );
}
