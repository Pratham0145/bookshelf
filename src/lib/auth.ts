// NextAuth Configuration for BookShelf
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "./db";

// Use NEXTAUTH_URL from environment for production URL
const PRODUCTION_URL = process.env.NEXTAUTH_URL || "https://bookshelf-app.vercel.app";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          redirect_uri: `${PRODUCTION_URL}/api/auth/callback/google`,
        },
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
  secret: process.env.NEXTAUTH_SECRET,
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
