import { z } from "zod";

export const ORDER_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUOTED",
  "WON",
  "LOST",
  "SPAM",
] as const;
export const MESSAGE_STATUSES = ["NEW", "READ", "HANDLED"] as const;

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((v) => !Number.isNaN(Date.parse(v)));

export const orderFiltersSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional().catch(undefined),
  productId: z.string().trim().max(40).optional().catch(undefined),
  from: dateOnly.optional().catch(undefined),
  to: dateOnly.optional().catch(undefined),
  q: z.string().trim().max(100).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).catch(1),
});
export type OrderFilters = z.infer<typeof orderFiltersSchema>;

export function parseOrderFilters(
  raw: Record<string, string | string[] | undefined>,
): OrderFilters {
  const first = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : v) || undefined;
  return orderFiltersSchema.parse({
    status: first(raw.status),
    productId: first(raw.productId),
    from: first(raw.from),
    to: first(raw.to),
    q: first(raw.q),
    page: first(raw.page),
  });
}

const id = z.string().min(1).max(40);
export const changeStatusSchema = z.object({
  id,
  status: z.enum(ORDER_STATUSES),
});
export const addNoteSchema = z.object({
  id,
  text: z.string().trim().min(1, "required").max(2000),
});
export const replySchema = z.object({
  id,
  subject: z.string().trim().min(1, "required").max(160),
  body: z.string().trim().min(1, "required").max(5000),
});
export const messageStatusSchema = z.object({
  id,
  status: z.enum(MESSAGE_STATUSES),
});
