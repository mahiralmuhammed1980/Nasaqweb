"use server";

import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { channelsForForm, CONSENT_POLICY_VERSION } from "@/lib/consent";
import { db } from "@/lib/db";
import { effectivePriceOf } from "@/lib/product-pricing";
import { guardPublicForm } from "@/server/public-form-guard";
import {
  notifyNewContactMessage,
  notifyNewOrder,
} from "@/server/orders/notify";
import { contactInputSchema, orderInputSchema } from "@/validators/order";
import { cookies } from "next/headers";
import { z } from "zod";

export type FieldErrors = Record<string, string>;
export type SubmitResult<T> =
  | ({ ok: true } & T)
  | {
      ok: false;
      error: "CAPTCHA" | "RATE_LIMIT" | "VALIDATION" | "NOT_FOUND" | "FAILED";
      fieldErrors?: FieldErrors;
      retryAfterSec?: number;
    };

function toFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** UTM لا تُحفظ إلا بعد موافقة كوكيز التحليل (كوكي consent؛ يُبنى شريطه في المرحلة 6) */
async function analyticsAllowed(): Promise<boolean> {
  try {
    const raw = (await cookies()).get("consent")?.value;
    if (!raw) return false;
    return (
      (JSON.parse(decodeURIComponent(raw)) as { analytics?: boolean })
        .analytics === true
    );
  } catch {
    return false;
  }
}

async function consentText(locale: "ar" | "en"): Promise<string> {
  const t = await getTranslations({ locale, namespace: "Consent" });
  const site = await getTranslations({ locale, namespace: "Site" });
  return t("marketing", { siteName: site("name") });
}

/** طلب جديد من زائر أو مستخدم. الترتيب: Turnstile ← rate limit ← Zod. */
export async function submitOrder(
  raw: unknown,
): Promise<SubmitResult<{ number: number }>> {
  const token =
    typeof raw === "object" && raw !== null
      ? (raw as { turnstileToken?: string }).turnstileToken
      : undefined;
  const guard = await guardPublicForm(
    "order",
    typeof token === "string" ? token : undefined,
  );
  if (!guard.ok) return guard;

  const parsed = orderInputSchema.safeParse(raw);
  if (!parsed.success)
    return {
      ok: false,
      error: "VALIDATION",
      fieldErrors: toFieldErrors(parsed.error),
    };
  const input = parsed.data;

  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    // الهدف: منتج منشور (مع عرضه الساري وخطته) أو جهاز منشور
    let productId: string | null = null;
    let hardwareId: string | null = null;
    let planId: string | null = null;
    let offerId: string | null = null;

    if (input.productSlug) {
      const product = await db.product.findFirst({
        where: { slug: input.productSlug, status: "PUBLISHED" },
        include: {
          plans: { select: { id: true } },
          offers: {
            where: { offer: { isActive: true } },
            include: { offer: true },
          },
        },
      });
      if (!product) return { ok: false, error: "NOT_FOUND" };
      productId = product.id;
      if (input.planId) {
        if (!product.plans.some((p) => p.id === input.planId))
          return {
            ok: false,
            error: "VALIDATION",
            fieldErrors: { planId: "invalidPlan" },
          };
        planId = input.planId;
      }
      // العرض الساري وقت الإرسال (أفضل عرض للزبون)، يُحسب في الخادم لا من الصفحة المخزنة
      const price = effectivePriceOf(product);
      offerId = price.kind === "PRICED" ? (price.offer?.id ?? null) : null;
    } else if (input.hardwareSlug) {
      const hardware = await db.hardware.findFirst({
        where: { slug: input.hardwareSlug, status: "PUBLISHED" },
        select: { id: true },
      });
      if (!hardware) return { ok: false, error: "NOT_FOUND" };
      hardwareId = hardware.id;
    }

    const utm = (await analyticsAllowed())
      ? {
          utmSource: input.utmSource,
          utmMedium: input.utmMedium,
          utmCampaign: input.utmCampaign,
        }
      : { utmSource: null, utmMedium: null, utmCampaign: null };

    const channels = input.marketingConsent
      ? channelsForForm({
          email: input.email,
          phoneHasWhatsapp: input.phoneHasWhatsapp,
        })
      : [];
    const text = channels.length ? await consentText(input.locale) : "";

    const order = await db.$transaction(async (tx) => {
      const created = await tx.orderRequest.create({
        data: {
          productId,
          hardwareId,
          planId,
          offerId,
          userId,
          name: input.name,
          phone: input.phone,
          phoneHasWhatsapp: input.phoneHasWhatsapp,
          email: input.email,
          company: input.company,
          city: input.city,
          country: input.country,
          preferredChannel: input.preferredChannel,
          message: input.message,
          locale: input.locale,
          referrer: input.referrer,
          ...utm,
          ipHash: guard.ipHash,
        },
        select: { id: true, number: true },
      });
      // موافقة تسويقية = سجل جديد لكل قناة (لا تعديل لسجل قديم أبداً)
      if (channels.length) {
        await tx.consentRecord.createMany({
          data: channels.map((channel) => ({
            userId,
            email: input.email,
            phone: input.phone,
            channel,
            granted: true,
            source: "ORDER_FORM" as const,
            policyVersion: CONSENT_POLICY_VERSION,
            consentText: text,
            ipHash: guard.ipHash,
            userAgent: guard.userAgent,
          })),
        });
      }
      return created;
    });

    // الطلب محفوظ؛ فشل البريد لا يغيّر ذلك (يُسجَّل في الخط الزمني)
    await notifyNewOrder(order.id);
    return { ok: true, number: order.number };
  } catch (error) {
    console.error(
      "[orders] submitOrder failed",
      error instanceof Error ? error.name : "unknown",
    );
    return { ok: false, error: "FAILED" };
  }
}

/** رسالة تواصل: نفس الحماية والموافقة (البريد فقط). */
export async function submitContact(
  raw: unknown,
): Promise<SubmitResult<Record<never, never>>> {
  const token =
    typeof raw === "object" && raw !== null
      ? (raw as { turnstileToken?: string }).turnstileToken
      : undefined;
  const guard = await guardPublicForm(
    "contact",
    typeof token === "string" ? token : undefined,
  );
  if (!guard.ok) return guard;

  const parsed = contactInputSchema.safeParse(raw);
  if (!parsed.success)
    return {
      ok: false,
      error: "VALIDATION",
      fieldErrors: toFieldErrors(parsed.error),
    };
  const input = parsed.data;

  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;
    const channels = input.marketingConsent
      ? channelsForForm({ email: input.email })
      : [];
    const text = channels.length ? await consentText(input.locale) : "";

    const message = await db.$transaction(async (tx) => {
      const created = await tx.contactMessage.create({
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          subject: input.subject,
          message: input.message,
          userId,
          locale: input.locale,
          ipHash: guard.ipHash,
        },
        select: { id: true },
      });
      if (channels.length) {
        await tx.consentRecord.createMany({
          data: channels.map((channel) => ({
            userId,
            email: input.email,
            phone: input.phone,
            channel,
            granted: true,
            source: "CONTACT_FORM" as const,
            policyVersion: CONSENT_POLICY_VERSION,
            consentText: text,
            ipHash: guard.ipHash,
            userAgent: guard.userAgent,
          })),
        });
      }
      return created;
    });
    await notifyNewContactMessage(message.id);
    return { ok: true };
  } catch (error) {
    console.error(
      "[contact] submitContact failed",
      error instanceof Error ? error.name : "unknown",
    );
    return { ok: false, error: "FAILED" };
  }
}
