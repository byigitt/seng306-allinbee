import { env } from "@/env";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { DefaultSession, NextAuthConfig, Profile } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import cuid from "cuid";

/**
 * Module augmentation for `next-auth` types.
 */
declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id: string;
      fName?: string;
      lName?: string;
      isAdmin?: boolean;
      isStaff?: boolean;
    } & DefaultSession["user"];
  }

  // Augment the default NextAuth User type to include fName and lName
  // This User type is what's available in callbacks like `signIn`
  interface User {
    fName?: string;
    lName?: string;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  adapter: PrismaAdapter(db),
  providers: [
    GoogleProvider({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        ) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          return null;
        }

        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile) {
        try {
          const nameParts = profile.name?.split(" ") ?? [];
          user.fName = nameParts[0] || "";
          user.lName = nameParts.slice(1).join(" ") || nameParts[0] || "";
        } catch (error) {
          console.error("Error processing name parts in signIn:", error);
        }
      }

      // Removed student creation block from here to prevent timing issues
      // The Student record will be created lazily when needed by other parts of the application.

      return true; // Continue with the sign-in process
    },
    session: async ({ session, user }) => {
      // user here is the user from your database (thanks to PrismaAdapter)
      // It includes id, fName, lName as defined in your Prisma schema.
      const adminRecord = await db.admin.findUnique({
        where: { userId: user.id },
      });
      const staffRecord = await db.staff.findUnique({
        where: { userId: user.id },
      });

      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          fName: user.fName,
          lName: user.lName,
          isAdmin: !!adminRecord,
          isStaff: !!staffRecord,
        },
      };
    },
  },
} satisfies NextAuthConfig;
