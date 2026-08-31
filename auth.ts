import NextAuth from "next-auth";
import { customFetch } from "next-auth";
import type { OAuthUserConfig, OAuthConfig } from "next-auth/providers";

interface IInstagramProfile {
  id: string;
  user_id: string;
  name: string;
  username: string;
  profile_picture_url: string;
}

function InstagramProvider(
  options: OAuthUserConfig<IInstagramProfile>,
): OAuthConfig<IInstagramProfile> {
  return {
    async [customFetch](input: RequestInfo | URL, init?: RequestInit) {
      const url = new URL(input instanceof Request ? input.url : input);
      if (url.pathname.endsWith("/access_token")) {
        const response = await fetch(input, init);
        const json = await response.json();

        const response2 = await fetch(
          `https://graph.instagram.com/access_token?${new URLSearchParams({
            grant_type: "ig_exchange_token",
            client_secret: options.clientSecret!,
            access_token: json.access_token,
          }).toString()}`,
          { method: "GET" },
        );
        const json2 = await response2.json();

        return Response.json({
          ...json2,
          scope: json.permissions?.join(",") ?? "",
        });
      }
      return fetch(input, init);
    },
    id: "instagram",
    name: "Instagram",
    type: "oauth",
    client: {
      token_endpoint_auth_method: "client_secret_post",
    },
    authorization: {
      url: "https://www.instagram.com/oauth/authorize",
      params: {
        scope:
          "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights",
        force_reauth: "true",
      },
    },
    token: {
      url: "https://api.instagram.com/oauth/access_token",
    },
    userinfo:
      "https://graph.instagram.com/v26.0/me?fields=id,user_id,username,account_type,name,profile_picture_url",
    async profile(profile) {
      return {
        id: profile.user_id,
        name: profile.username,
        email: null,
        image: profile.profile_picture_url,
      };
    },
    style: { bg: "#fff", text: "#000" },
    options,
  } as const;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    InstagramProvider({
      clientId: process.env.AUTH_INSTAGRAM_ID,
      clientSecret: process.env.AUTH_INSTAGRAM_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.igAccessToken = account.access_token;
        token.igBusinessId = (profile as any)?.user_id ?? (profile as any)?.id;
        token.igUsername = (profile as any)?.username;
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
