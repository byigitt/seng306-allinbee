import { env } from "@/env";
console.log(
  `[authConfig] Using AUTH_SECRET (from env object) for NextAuth(): "${env.AUTH_SECRET}" (length: ${env.AUTH_SECRET?.length})`
); // Debug log
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
  session: { strategy: "jwt" },
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
    async jwt({ token, user, account, profile }) {
      console.log("[jwt Callback] Triggered.");
      console.log(
        "[jwt Callback] Initial token:",
        JSON.stringify(token, null, 2)
      );
      console.log(
        "[jwt Callback] User object (available on sign-in):",
        JSON.stringify(user, null, 2)
      );
      console.log(
        "[jwt Callback] Account object (available on sign-in):",
        JSON.stringify(account, null, 2)
      );
      console.log(
        "[jwt Callback] Profile object (available on OAuth sign-in):",
        JSON.stringify(profile, null, 2)
      );

      // This callback is called when a JWT is created (i.e., on sign in)
      // and updated (whenever a session is accessed in the client).
      if (user) {
        // user object is available on initial sign-in
        token.id = user.id;
        token.email = user.email; // Ensure email is included
        token.fName = user.fName;
        token.lName = user.lName;
        // Fetch isAdmin and isStaff status from the database
        try {
          const dbUser = await db.user.findUnique({
            where: { id: user.id },
            include: { admin: true, staff: true },
          });
          if (dbUser) {
            token.isAdmin = !!dbUser.admin;
            token.isStaff = !!dbUser.staff;
            // If fName or lName might be missing from the initial 'user' object from 'authorize'
            // but are guaranteed in the DB, you can re-assign them here too.
            // token.fName = dbUser.fName;
            // token.lName = dbUser.lName;
          } else {
            console.log(
              `[jwt Callback] User not found in DB for id: ${user.id}`
            );
            token.isAdmin = false;
            token.isStaff = false;
          }
        } catch (error) {
          console.error("[jwt Callback] Error fetching user roles:", error);
          token.isAdmin = false;
          token.isStaff = false;
        }
      }
      // Ensure essential fields always exist on the token, even if null/false
      token.id = token.id || null;
      token.email = token.email || null;
      token.fName = token.fName || null;
      token.lName = token.lName || null;
      token.isAdmin = token.isAdmin || false;
      token.isStaff = token.isStaff || false;

      console.log(
        "[jwt Callback] Returning token:",
        JSON.stringify(token, null, 2)
      );
      return token;
    },
    session: async ({ session, token }) => {
      console.log("[SessionCallback - JWT] Triggered.");
      console.log(
        "[SessionCallback - JWT] Initial session object:",
        JSON.stringify(session, null, 2)
      );
      console.log(
        "[SessionCallback - JWT] Token from jwt callback:",
        JSON.stringify(token, null, 2)
      );

      // token contains the data from the jwt callback
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string; // Ensure email is passed
        session.user.fName = token.fName as string;
        session.user.lName = token.lName as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.isStaff = token.isStaff as boolean;
      }
      console.log(
        "[SessionCallback - JWT] Returning new session object:",
        JSON.stringify(session, null, 2)
      );
      return session;
    },
    async signIn({ user, account, profile }) {
      console.log("[signIn Callback] User:", JSON.stringify(user, null, 2));
      console.log(
        "[signIn Callback] Account:",
        JSON.stringify(account, null, 2)
      );
      console.log(
        "[signIn Callback] Profile:",
        JSON.stringify(profile, null, 2)
      );

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
  },
} satisfies NextAuthConfig;
