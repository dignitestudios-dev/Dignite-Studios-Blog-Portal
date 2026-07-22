import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Edge-safe auth config: no Node.js-only imports (crypto, mongoose).
// The authorize callback runs only on the auth API route (Node.js), not in middleware.
export const authConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize() {
        // Real logic is in auth.ts (Node.js runtime).
        // This stub is required here so next-auth knows the provider exists.
        return null;
      },
    }),
  ],
  session: { strategy: "jwt" as const },
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = nextUrl.pathname.startsWith("/dashboard") || nextUrl.pathname.startsWith("/preview");
      if (isProtected) return isLoggedIn;
      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) token.role = (user as { role?: string }).role;
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
        if (token.name) {
          session.user.name = token.name;
        }
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
