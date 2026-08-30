import NextAuth from "next-auth";
import Instagram from "next-auth/providers/instagram";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Instagram({
      // переопределяем как СТРОКУ (тот же тип, что и дефолт в исходнике провайдера),
      // чтобы не ломать deep-merge при смешивании строки и объекта
      authorization:
        "https://api.instagram.com/oauth/authorize?scope=instagram_business_basic,instagram_manage_comments,instagram_business_manage_messages,pages_show_list,public_profile,pages_read_engagement",
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
