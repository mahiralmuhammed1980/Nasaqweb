"use server";

import { z } from "zod";
import { adminAction } from "./admin-action";

const pingAction = adminAction(z.object({}), async (_input, { admin }) => ({
  adminId: admin.id,
}));

/** أول Server Action إداري: نموذج للأفعال القادمة ومحور اختبار الصلاحيات. */
export async function adminPing(input: unknown) {
  return pingAction(input);
}
