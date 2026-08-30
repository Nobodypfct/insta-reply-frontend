'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { createClient } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function InstagramConnectedPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [message, setMessage] = useState('Завершаем подключение…');

  useEffect(() => {
    async function finish() {
      if (status === 'loading') return;

      const s = session as any;
      if (!s?.igAccessToken || !s?.igBusinessId) {
        setMessage('Не удалось получить данные Instagram. Попробуйте снова.');
        setTimeout(() => router.push('/dashboard?connect_error=no_session'), 1500);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push('/login');
        return;
      }

      // передаём короткоживущий токен от Auth.js нашему backend,
      // он сам обменяет на долгоживущий, сохранит в БД и подпишет на вебхуки
      const res = await fetch(`${API_URL}/api/complete-instagram-connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: data.user.id,
          ig_business_id: s.igBusinessId,
          username: s.igUsername,
          short_lived_token: s.igAccessToken,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        router.push(`/dashboard?connected=${json.username}`);
      } else {
        router.push('/dashboard?connect_error=backend_failed');
      }
    }
    finish();
  }, [status]);

  return (
    <main className="min-h-screen bg-[#0B0F14] text-[#E7ECF2] flex items-center justify-center">
      <p className="text-sm text-[#7C8A9C]">{message}</p>
    </main>
  );
}
