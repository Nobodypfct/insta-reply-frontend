"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setResetSent(true);
  }

  return (
    <main className="min-h-screen bg-[#0B0F14] text-[#E7ECF2] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 text-sm tracking-wide text-[#7C8A9C] mb-2">
            INSTA-REPLY
          </div>
          <h1 className="text-2xl font-semibold">Восстановление пароля</h1>
        </div>

        {resetSent ? (
          <div className="rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-5 text-sm leading-relaxed">
            Если аккаунт с таким email существует, мы отправили на него ссылку
            для сброса пароля.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#7C8A9C] mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-[#141B24] border border-[#232D3A] px-3.5 py-2.5 text-sm outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF] transition-colors"
                placeholder="you@example.com"
              />
            </div>

            {error && (
              <p className="text-sm text-[#F87171] leading-relaxed">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#4F7CFF] hover:bg-[#3D68EA] disabled:opacity-50 transition-colors text-white text-sm font-medium py-2.5 mt-2"
            >
              {loading ? "Секунду…" : "Отправить ссылку для сброса"}
            </button>
          </form>
        )}

        <p className="text-sm text-[#7C8A9C] text-center mt-6">
          <Link href="/login" className="text-[#4F7CFF] hover:underline">
            Вернуться ко входу
          </Link>
        </p>
      </div>
    </main>
  );
}
