// NextAuth Configuration for BookShelf
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "./db";

// Use the external URL for production - ALWAYS use external URL
const BASE_URL = process.env.NEXTAUTH_URL || "https://n1tzy1zy7eh0-d.space.z.ai";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "select_account",
          access_type: "offline",
          redirect_uri: `${BASE_URL}/api/auth/callback/google`,
        },
      },
      // Override the token endpoint to use correct redirect_uri
      token: {
        url: "https://oauth2.googleapis.com/token",
        async request(context) {
          const { provider, params, checks } = context;
          
          // Exchange code for tokens with explicit redirect_uri
          const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              code: params.code as string,
              client_id: provider.clientId as string,
              client_secret: provider.clientSecret as string,
              redirect_uri: `${BASE_URL}/api/auth/callback/google`,
              grant_type: "authorization_code",
            }),
          });

          if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error("[Google Token Exchange] Failed:", error);
            throw new Error("Failed to exchange token");
          }

          const tokens = await tokenResponse.json();
          
          return { tokens };
        },
      },
      userinfo: {
        url: "https://www.googleapis.com/oauth2/v2/userinfo",
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        const dbUser = await db.user.findUnique({
          where: { email: session.user.email || "" },
        });
        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.name = dbUser.name;
          session.user.image = dbUser.image || undefined;
        }
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async signIn({ user }) {
      try {
        await db.user.upsert({
          where: { email: user.email || "" },
          update: {
            name: user.name,
            image: user.image,
            updatedAt: new Date(),
          },
          create: {
            email: user.email || "",
            name: user.name,
            image: user.image,
          },
        });
        return true;
      } catch (error) {
        console.error("Error creating user:", error);
        return true;
      }
    },
  },
  debug: true,
  // Force the correct URL
  useSecureCookies: true,
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
