import NextAuth from "next-auth";
import Facebook from "next-auth/providers/facebook";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Resend from "next-auth/providers/resend";
import type { Provider } from "next-auth/providers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import {
  isVerifiedEmailProvider,
  shouldPromoteToAdmin,
} from "@/lib/auth/admin";
import {
  getEnabledOAuthProviders,
  isEmailLoginEnabled,
} from "@/lib/auth/providers";
import { adoptVerifiedEmail } from "@/lib/auth/adopt-verified-email";
import { sendLoginLink } from "@/lib/email/send-login-link";

function buildProviders(): Provider[] {
  const providers: Provider[] = [];
  const enabled = getEnabledOAuthProviders();

  // الربط التلقائي بالبريد لـ Google فقط (يوفّر email_verified). غيره يحتاج الدخول بالبريد أولاً.
  if (enabled.includes("google"))
    providers.push(Google({ allowDangerousEmailAccountLinking: true }));
  if (enabled.includes("facebook")) providers.push(Facebook);
  if (enabled.includes("microsoft-entra-id")) providers.push(MicrosoftEntraID);

  if (isEmailLoginEnabled()) {
    providers.push(
      Resend({
        apiKey: process.env.RESEND_API_KEY ?? "dev",
        from: process.env.EMAIL_FROM ?? "dev@localhost",
        sendVerificationRequest: ({ identifier, url }) =>
          sendLoginLink({ to: identifier, url }),
      }),
    );
  }
  return providers;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "database" },
  providers: buildProviders(),
  pages: { signIn: "/login", verifyRequest: "/login/verify", error: "/login" },
  trustHost: true,
  callbacks: {
    async signIn({ user, account, profile, email }) {
      const provider = account?.provider;
      if (provider === "google" && profile?.email_verified !== true)
        return false;

      // رابط البريد يُعدّ موثّقاً عند النقر عليه (لا عند طلبه). Google موثّق بـ email_verified.
      const isVerifiedNow =
        provider === "google" ||
        (provider === "resend" && !email?.verificationRequest);
      if (isVerifiedNow && isVerifiedEmailProvider(provider)) {
        const address = provider === "google" ? profile?.email : user.email;
        if (address) await adoptVerifiedEmail(db, address);
      }
      return true;
    },
    session({ session, user }) {
      session.user.id = user.id;
      session.user.role = (user as { role?: "USER" | "ADMIN" }).role ?? "USER";
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (!user.id) return;
      const promote = shouldPromoteToAdmin({
        email: user.email,
        provider: account?.provider,
        adminEmail: process.env.ADMIN_EMAIL,
      });
      await db.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          ...(promote ? { role: "ADMIN" } : {}),
        },
      });
    },
  },
});
