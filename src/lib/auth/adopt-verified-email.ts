type UserRow = { id: string; emailVerified: Date | null } | null;

/** الجزء الذي نحتاجه من Prisma (يسهّل الاختبار بدون قاعدة بيانات). */
export type AdoptDb = {
  user: {
    findUnique(args: { where: { email: string } }): Promise<UserRow>;
    update(args: {
      where: { id: string };
      data: { emailVerified: Date };
    }): Promise<unknown>;
  };
  account: {
    deleteMany(args: { where: { userId: string } }): Promise<unknown>;
  };
  session: {
    deleteMany(args: { where: { userId: string } }): Promise<unknown>;
  };
};

/**
 * عندما يثبت مزوّد موثوق ملكية بريد، وكان لهذا البريد مستخدم سابق غير موثّق
 * (مثلاً أُنشئ عبر Facebook ببريد لم يُتحقق منه)، نزيل حساباته المرتبطة وجلساته
 * حتى لا يرث صاحبُ ذلك الحساب الوصولَ بعد الربط (pre-hijacking).
 */
export async function adoptVerifiedEmail(
  db: AdoptDb,
  rawEmail: string,
): Promise<void> {
  const email = rawEmail.trim().toLowerCase();
  if (!email) return;
  const user = await db.user.findUnique({ where: { email } });
  if (!user || user.emailVerified) return;
  await db.account.deleteMany({ where: { userId: user.id } });
  await db.session.deleteMany({ where: { userId: user.id } });
  await db.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date() },
  });
}
