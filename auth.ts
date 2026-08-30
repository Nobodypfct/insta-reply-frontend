import NextAuth from 'next-auth';

// Кастомный провайдер под Instagram Business Login (Instagram API with Instagram Login)
// Используем NextAuth только чтобы пройти authorize + обмен кода на токен -
// эта часть у нас глючила при самописной реализации. Дальше (обмен на
// долгоживущий токен, сохранение в БД) делает наш собственный backend.
const InstagramProvider = {
  id: 'instagram',
  name: 'Instagram',
  type: 'oauth' as const,
  authorization: {
    url: 'https://www.instagram.com/oauth/authorize',
    params: {
      scope: 'instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages',
      response_type: 'code',
    },
  },
  token: {
    url: 'https://api.instagram.com/oauth/access_token',
    async request({ params, provider }: any) {
      const body = new URLSearchParams({
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: provider.callbackUrl,
        code: params.code,
      });

      const response = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      const data = await response.json();

      if (data.error_type) {
        throw new Error(`Instagram OAuth error: ${data.error_message}`);
      }

      return {
        tokens: {
          access_token: data.access_token,
          // instagram basic display / business login возвращает ещё user_id
          user_id: data.user_id,
        },
      };
    },
  },
  userinfo: {
    url: 'https://graph.instagram.com/me',
    params: { fields: 'id,username' },
    async request({ tokens, provider }: any) {
      const url = new URL(provider.userinfo.url);
      url.searchParams.set('fields', 'id,username');
      url.searchParams.set('access_token', tokens.access_token as string);
      const res = await fetch(url.toString());
      return res.json();
    },
  },
  profile(profile: any) {
    return {
      id: profile.id,
      name: profile.username,
    };
  },
  clientId: process.env.IG_APP_ID,
  clientSecret: process.env.IG_APP_SECRET,
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [InstagramProvider],
  callbacks: {
    async jwt({ token, account, profile }) {
      // прокидываем short-lived access_token и данные аккаунта в сессию,
      // чтобы забрать их на клиенте и передать нашему backend
      if (account) {
        token.igAccessToken = account.access_token;
        token.igBusinessId = (profile as any)?.id;
        token.igUsername = (profile as any)?.name;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).igAccessToken = token.igAccessToken;
      (session as any).igBusinessId = token.igBusinessId;
      (session as any).igUsername = token.igUsername;
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});
