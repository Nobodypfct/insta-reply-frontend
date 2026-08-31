import NextAuth from "next-auth";
import Instagram from "next-auth/providers/instagram";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Instagram({
      // scope и redirect_uri, подтверждённые как рабочие через официальный Embed URL от meta
      authorization:
        "https://www.instagram.com/oauth/authorize?force_reauth=true&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights",
      checks: ["state"],
      token: {
        url: "https://api.instagram.com/oauth/access_token",
        async request({ params, provider }: any) {
          const body = new URLSearchParams({
            client_id: provider.clientId,
            client_secret: provider.clientSecret,
            grant_type: "authorization_code",
            redirect_uri: provider.callbackUrl,
            code: params.code,
          });

          const response = await fetch(
            "https://api.instagram.com/oauth/access_token",
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body,
            },
          );
          const data = await response.json();

          if (data.error_type) {
            throw new Error(`Instagram OAuth error: ${data.error_message}`);
          }

          // сразу меняем короткоживущий токен на долгоживущий (60 дней),
          // как в рабочем примере - делаем это ДО того как отдать ответ Auth.js
          const longLivedRes = await fetch(
            `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${provider.clientSecret}&access_token=${data.access_token}`,
          );
          const longLivedData = await longLivedRes.json();

          return {
            tokens: {
              access_token: longLivedData.access_token || data.access_token,
              token_type: "bearer",
              expires_in: longLivedData.expires_in,
              user_id: data.user_id,
            },
          };
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.igAccessToken = account.access_token;
        token.igBusinessId = (profile as any)?.id ?? account.providerAccountId;
        token.igUsername = (profile as any)?.username ?? (profile as any)?.name;
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
    signIn: "/login",
  },
});
