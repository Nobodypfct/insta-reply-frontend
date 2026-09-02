"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      setResetSent(true);
      return;
    }

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/dashboard");
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }

      // Supabase не даёт прямой ошибки "уже зарегистрирован" (по соображениям
      // безопасности), но если identities пустой - значит юзер с таким email
      // уже существует и подтверждён
      if (data.user && data.user.identities?.length === 0) {
        setError(
          "Этот email уже зарегистрирован. Попробуйте войти или восстановить пароль.",
        );
        return;
      }

      setSignupDone(true);
    }
  }

  async function handleOAuth(provider: "google" | "facebook") {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  return (
    <main className="min-h-screen bg-[#0B0F14] text-[#E7ECF2] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 text-sm tracking-wide text-[#7C8A9C] mb-2">
            INSTA-REPLY
          </div>
          <h1 className="text-2xl font-semibold">
            {mode === "login" && "Войти в кабинет"}
            {mode === "signup" && "Создать аккаунт"}
            {mode === "forgot" && "Восстановление пароля"}
          </h1>
        </div>

        {signupDone ? (
          <div className="rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-5 text-sm leading-relaxed">
            Проверьте почту — мы отправили ссылку для подтверждения аккаунта на{" "}
            {email}.
          </div>
        ) : resetSent ? (
          <div className="rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 p-5 text-sm leading-relaxed">
            Если аккаунт с таким email существует, мы отправили на него ссылку
            для сброса пароля.
          </div>
        ) : (
          <>
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

              {mode !== "forgot" && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm text-[#7C8A9C]">Пароль</label>
                    {mode === "login" && (
                      <button
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-xs text-[#4F7CFF] hover:underline"
                      >
                        Забыли пароль?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg bg-[#141B24] border border-[#232D3A] px-3.5 py-2.5 text-sm outline-none focus:border-[#4F7CFF] focus:ring-1 focus:ring-[#4F7CFF] transition-colors"
                    placeholder="не меньше 6 символов"
                  />
                </div>
              )}

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
                {loading
                  ? "Секунду…"
                  : mode === "login"
                    ? "Войти"
                    : mode === "signup"
                      ? "Создать аккаунт"
                      : "Отправить ссылку для сброса"}
              </button>
            </form>

            {mode !== "forgot" && (
              <>
                <div className="flex items-center gap-3 my-5">
                  <div className="h-px flex-1 bg-[#232D3A]" />
                  <span className="text-xs text-[#7C8A9C]">или</span>
                  <div className="h-px flex-1 bg-[#232D3A]" />
                </div>

                <div className="space-y-2.5">
                  <button
                    onClick={() => handleOAuth("google")}
                    className="w-full rounded-lg border border-[#232D3A] bg-[#141B24] hover:bg-[#1B2430] transition-colors text-sm py-2.5 flex items-center justify-center gap-2"
                  >
                    Продолжить с Google
                  </button>
                  {/* <button
                    onClick={() => handleOAuth("facebook")}
                    className="w-full rounded-lg border border-[#232D3A] bg-[#141B24] hover:bg-[#1B2430] transition-colors text-sm py-2.5 flex items-center justify-center gap-2"
                  >
                    Продолжить с Facebook
                  </button> */}
                </div>
              </>
            )}
          </>
        )}

        {!signupDone && !resetSent && (
          <p className="text-sm text-[#7C8A9C] text-center mt-6">
            {mode === "forgot" ? (
              <button
                onClick={() => setMode("login")}
                className="text-[#4F7CFF] hover:underline"
              >
                Вернуться ко входу
              </button>
            ) : (
              <>
                {mode === "login" ? "Ещё нет аккаунта?" : "Уже есть аккаунт?"}{" "}
                <button
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-[#4F7CFF] hover:underline"
                >
                  {mode === "login" ? "Создать" : "Войти"}
                </button>
              </>
            )}
          </p>
        )}
      </div>
    </main>
  );
}
