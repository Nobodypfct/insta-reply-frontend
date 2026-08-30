'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { createClient } from '@/lib/supabase';

type IgAccount = {
  id: string;
  ig_business_id: string;
  username: string;
  webhook_enabled: boolean;
  created_at: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<IgAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const connectedUsername = searchParams.get('connected');
  const connectError = searchParams.get('connect_error');

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push('/login');
        return;
      }
      setUserId(data.user.id);

      const res = await fetch(`${API_URL}/api/ig-accounts?user_id=${data.user.id}`);
      const json = await res.json();
      setAccounts(json.accounts || []);
      setLoading(false);
    }
    init();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  function handleConnect() {
    if (!userId) return;
    signIn('instagram', { callbackUrl: '/instagram-connected' });
  }

  return (
    <main className="min-h-screen bg-[#0B0F14] text-[#E7ECF2]">
      <header className="border-b border-[#1B2430] px-6 py-4 flex items-center justify-between">
        <span className="text-sm tracking-wide text-[#7C8A9C]">INSTA-REPLY</span>
        <button
          onClick={handleLogout}
          className="text-sm text-[#7C8A9C] hover:text-[#E7ECF2] transition-colors"
        >
          Выйти
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold">Ваши Instagram-аккаунты</h1>
          <button
            onClick={handleConnect}
            className="rounded-lg bg-[#4F7CFF] hover:bg-[#3D68EA] transition-colors text-white text-sm font-medium px-4 py-2"
          >
            + Подключить Instagram
          </button>
        </div>

        {connectedUsername && (
          <div className="mb-6 rounded-xl border border-[#22C55E]/30 bg-[#22C55E]/10 px-4 py-3 text-sm">
            Аккаунт @{connectedUsername} успешно подключён.
          </div>
        )}
        {connectError && (
          <div className="mb-6 rounded-xl border border-[#F87171]/30 bg-[#F87171]/10 px-4 py-3 text-sm">
            Не получилось подключить аккаунт ({connectError}). Попробуйте ещё раз.
          </div>
        )}

        {loading ? (
          <p className="text-sm text-[#7C8A9C]">Загрузка…</p>
        ) : accounts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#232D3A] px-6 py-14 text-center">
            <p className="text-sm text-[#7C8A9C] mb-4">
              Пока нет подключённых аккаунтов. Подключите Instagram, чтобы включить
              автоответ на комментарии и DM.
            </p>
            <button
              onClick={handleConnect}
              className="rounded-lg bg-[#4F7CFF] hover:bg-[#3D68EA] transition-colors text-white text-sm font-medium px-4 py-2"
            >
              Подключить первый аккаунт
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {accounts.map((acc) => (
              <li
                key={acc.id}
                className="rounded-xl border border-[#232D3A] bg-[#141B24] px-5 py-4 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium">@{acc.username}</p>
                  <p className="text-xs text-[#7C8A9C] mt-0.5">
                    Подключён {new Date(acc.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full ${
                    acc.webhook_enabled
                      ? 'bg-[#22C55E]/15 text-[#4ADE80]'
                      : 'bg-[#7C8A9C]/15 text-[#7C8A9C]'
                  }`}
                >
                  {acc.webhook_enabled ? 'Включён' : 'Выключен'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
