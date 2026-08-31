"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase сам обрабатывает токен восстановления из URL и создаёт временную
    // сессию - просто дожидаемся, пока она подтянется, прежде чем показать форму
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен быть не короче 6 символов");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  return (
    <main className="min-h-screen bg-[#0B0F14] text-[#E7ECF2] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-8 text-center">
          Новый пароль
        </h1>

        {done ? (
          <div className="rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-5 text-sm leading-relaxed">
            Пароль обновлён. Переносим в кабинет…
          </div>
        ) : !ready ? (
          <p className="text-sm text-[#7C8A9C] text-center">
            Проверяем ссылку…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#7C8A9C] mb-1.5">
                Новый пароль
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-[#141B24] border border-[#232D3A] px-3.5 py-2.5 text-sm outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-[#7C8A9C] mb-1.5">
                Повторите пароль
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg bg-[#141B24] border border-[#232D3A] px-3.5 py-2.5 text-sm outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF] transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-[#F87171] leading-relaxed">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#4F7CFF] hover:bg-[#3D68EA] disabled:opacity-50 transition-colors text-white text-sm font-medium py-2.5 mt-2"
            >
              {loading ? "Секунду…" : "Сохранить пароль"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
