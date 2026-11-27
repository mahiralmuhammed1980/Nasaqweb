import type { z } from "zod";
import {
  ForbiddenError,
  UnauthorizedError,
  requireAdmin,
  type SessionUser,
} from "@/lib/auth/guards";

export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: "VALIDATION" | "UNAUTHORIZED" | "FORBIDDEN" | "FAILED";
    };

/**
 * غلاف لكل Server Action إداري: التحقق بـ Zod ثم فحص صلاحية ADMIN داخل الدالة نفسها.
 * المعالج لا يُستدعى أبداً لغير المدير.
 */
export function adminAction<S extends z.ZodType, R>(
  schema: S,
  handler: (input: z.infer<S>, ctx: { admin: SessionUser }) => Promise<R>,
) {
  return async (raw: unknown): Promise<ActionResult<R>> => {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return { ok: false, error: "VALIDATION" };
    try {
      const admin = await requireAdmin();
      return { ok: true, data: await handler(parsed.data, { admin }) };
    } catch (error) {
      if (error instanceof UnauthorizedError)
        return { ok: false, error: "UNAUTHORIZED" };
      if (error instanceof ForbiddenError)
        return { ok: false, error: "FORBIDDEN" };
      console.error(
        "[admin-action] failed",
        error instanceof Error ? error.name : "unknown",
      );
      return { ok: false, error: "FAILED" };
    }
  };
}
