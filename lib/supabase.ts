import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Синглтон, не пересоздаём клиент на каждый вызов — намеренно, не просто
 * стилистика. `createBrowserClient` при autoRefreshToken (дефолт в
 * браузере — см. node_modules/@supabase/ssr's createBrowserClient.js)
 * заводит собственный фоновый setInterval-тикер, который сам себе
 * рефрешит токен по расписанию. Без синглтона каждый компонент, который
 * зовёт createClient(), заводил бы СВОЙ отдельный тикер — они никогда не
 * останавливаются, копятся за время жизни сессии (утечка, не просто
 * неэффективность). Один клиент на вкладку — один тикер.
 *
 * Модульный синглтон тут безопасен именно потому, что этот файл — ТОЛЬКО
 * браузерный клиент (см. lib/supabase-server.ts/-middleware.ts для
 * серверных контекстов, которые ДОЛЖНЫ оставаться per-request — общий
 * модульный синглтон в серверном коде Next.js утёк бы сессию между
 * юзерами, тут же весь модуль живёт в рамках одной вкладки браузера).
 */
let client: SupabaseClient | undefined;

export function createClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          // Дефолты и так true в браузере — прописаны явно, чтобы это
          // было решением, а не молчаливым допущением (см. задачу).
          autoRefreshToken: true,
          persistSession: true,
        },
      },
    );
  }
  return client;
}
