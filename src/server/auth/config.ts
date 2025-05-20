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
    async jwt({ token, user, account, profile, trigger }) {
      console.log("[jwt Callback] Triggered. Trigger:", trigger);
      console.log(
        "[jwt Callback] Initial token:",
        JSON.stringify(token, null, 2)
      );
      console.log(
        "[jwt Callback] User object (available on sign-in/update):",
        JSON.stringify(user, null, 2)
      );

      // If it's an initial sign-in or an update event where 'user' is passed,
      // ensure basic details are seeded into the token.
      if (user) {
        token.id = user.id;
        token.email = user.email; // Email from user object
        token.fName = user.fName;
        token.lName = user.lName;
      }

      // Always try to refresh user details and roles from DB if token.id exists.
      // This ensures roles are up-to-date even if granted after initial login or changed mid-session.
      if (token.id) {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            include: { admin: true, staff: true },
          });
          if (dbUser) {
            token.isAdmin = !!dbUser.admin;
            token.isStaff = !!dbUser.staff;
            // Keep token fName, lName, email fresh from DB as well
            token.fName = dbUser.fName;
            token.lName = dbUser.lName;
            token.email = dbUser.email; // Update email from DB
          } else {
            // User associated with token.id not found in DB (e.g., deleted).
            // This effectively invalidates the session from a role perspective.
            console.warn(
              `[jwt Callback] User with id ${token.id} not found in DB during refresh.`
            );
            token.isAdmin = false;
            token.isStaff = false;
            // Potentially clear other user-specific fields from token or handle as error
            // For now, we'll let the session callback handle what to put in the session.user
          }
        } catch (error) {
          console.error(
            "[jwt Callback] Error fetching user roles/details during refresh:",
            error
          );
          // Fallback: keep existing token roles or default to false to be safe if DB call fails
          token.isAdmin = token.isAdmin || false;
          token.isStaff = token.isStaff || false;
        }
      } else {
        // If token.id is somehow not set (should not happen for a valid session after initial login),
        // default roles to false. This indicates an issue with the token's state.
        console.warn(
          "[jwt Callback] token.id is missing, cannot refresh roles."
        );
        token.isAdmin = false;
        token.isStaff = false;
      }

      // Ensure essential fields always exist on the token to maintain a consistent structure.
      token.id = token.id || null; // Can be null if something went wrong
      token.email = token.email || null;
      token.fName = token.fName || null;
      token.lName = token.lName || null;
      token.isAdmin = token.isAdmin || false; // Default to false if undefined
      token.isStaff = token.isStaff || false; // Default to false if undefined

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
