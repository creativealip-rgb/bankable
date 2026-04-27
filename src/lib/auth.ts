import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import bcrypt from "bcryptjs";
import { and, eq, gt } from "drizzle-orm";
import { APIError } from "better-auth/api";
import { emailOTP } from "better-auth/plugins";
import { emailService } from "./email/service";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    password: {
      hash: async (password) => {
        return await bcrypt.hash(password, 12);
      },
      verify: async ({ hash, password }) => {
        return await bcrypt.compare(password, hash);
      },
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "MEMBER",
        input: false, // don't allow users to set their own role
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // update session every 24 hours
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const activeSession = await db.query.sessions.findFirst({
            where: and(
              eq(schema.sessions.userId, session.userId),
              gt(schema.sessions.expiresAt, new Date())
            ),
          });

          if (activeSession) {
            throw new APIError("BAD_REQUEST", {
              message: "Akun Anda sedang digunakan di perangkat atau browser lain. Silakan keluar (logout) dari perangkat tersebut terlebih dahulu untuk melanjutkan.",
            });
          }
        },
      },
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await emailService.sendOTP(email, otp, type);
      },
      sendVerificationOnSignUp: true,
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
