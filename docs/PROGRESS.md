# PROGRESS.md: سجل التقدم والقرارات

## المرحلة 0: الأساس — مكتملة محلياً (بانتظار CI وVercel)

### أُنجز

- Next.js 16 (App Router) + TypeScript strict + Tailwind v4 + مكوّن Button بنمط shadcn/ui.
- next-intl: `/ar` (افتراضي، RTL) و`/en` (LTR)، الخط IBM Plex Sans Arabic، مبدّل لغة يحافظ على المسار والـ query.
- Prisma 7 متصل بـ PostgreSQL (driver adapter)، نموذج `SiteSetting` وmigration أولى، `src/lib/db.ts`.
- ESLint (مع قاعدة تمنع `ml-/mr-/pl-/pr-/left-/right-`) + Prettier، Vitest، Playwright (اختباران يعملان).
- GitHub Actions: lint، typecheck، test، build على كل PR.
- ترويسة وتذييل (روابطها مؤقتة تشير للرئيسية)، صفحة 404 مخصّصة.
- `.env.example` كامل بالأوصاف.

### معايير القبول

- [x] `pnpm build` ينجح دون تحذيرات TypeScript
- [x] `/ar` = `dir="rtl"` و`/en` = `dir="ltr"` والمبدّل يحافظ على الصفحة (اختبار E2E)
- [ ] CI أخضر على PR (لم يُنشأ PR بعد)
- [ ] النشر على Vercel (يُربط لاحقاً مع المالك)

### قرارات

- `SPEC.md` نُقل إلى `docs/SPEC.md` كما يشير CLAUDE.md.
- الفرع: `claude/vibrant-allen-f9mtgz` (المحدد للجلسة) بدل `phase-0-*`.
- مكتبات إضافية خارج القائمة: `@prisma/adapter-pg` و`pg` (إلزامية في Prisma 7)، `class-variance-authority` و`clsx` و`tailwind-merge` و`lucide-react` و`@radix-ui/react-slot` و`tw-animate-css` (متطلبات shadcn/ui)، `tsx` (seed)، `dotenv`، `jsdom`/`@vitejs/plugin-react` (اختبارات المكوّنات لاحقاً).
- TypeScript 5.9 (وليس 7) لضمان توافق Next.
- `proxy.ts` بدل `middleware.ts` (اسم Next 16)؛ يستخدمه next-intl الآن وستُضاف إليه حماية `/account` و`/admin` في المرحلة 1.
- Playwright محلياً يستخدم متصفحاً مثبّتاً عبر `PW_CHROMIUM_PATH` عند الحاجة.

### قرارات مسجّلة للمراحل القادمة (من نقاش المواصفات)

- حدث `search_performed`: لا يُرسل نص البحث (قد يحوي بيانات شخصية)، بل `results_count` فقط.
- السجلات: سجلات Vercel فقط، بالمعرّفات الداخلية دون بيانات شخصية.
- `demoUsername/demoPassword` نص عادي دون تشفير (بيانات نسخة تجريبية).
- CSP `frame-src`: يُبنى من أصول (origins) `demoUrl` للمنتجات المنشورة (مخزّنة مؤقتاً وتُبطل عند الحفظ) + YouTube وBunny.
- نص الموافقة التسويقية: أكتبه أنا بالعربية والإنجليزية بـ `policyVersion = 1` (لا صيغة قانونية جاهزة؛ يُراجعها المالك قبل الإطلاق).
- `OrderRequest.number`: sequence في PostgreSQL يبدأ من 1001.
- حذف الحساب: تُفرَّغ بيانات الطلب الشخصية (تُبقى الطلبات مجهولة)، و`ConsentRecord` يحتفظ بالبريد/الهاتف كسجل تاريخي لإثبات السحب.

### المتبقي

- فتح PR وتأكيد الـ CI، وربط Vercel.
