import NextAuth from "next-auth";
import Instagram from "next-auth/providers/instagram";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Instagram({
      clientId: process.env.IG_APP_ID,
      clientSecret: process.env.IG_APP_SECRET,
      authorization: {
        params: {
          scope:
            "instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages",
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
