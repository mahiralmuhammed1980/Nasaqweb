# PROGRESS.md: سجل التقدم والقرارات

## المرحلة 0: الأساس — مدموجة (PR #1، الـ CI أخضر). يبقى ربط Vercel

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

---

## المرحلة 1: الدخول والأدوار — منجزة محلياً (بانتظار مراجعتك)

### أُنجز

- Auth.js v5 مع Prisma adapter وجلسات في قاعدة البيانات؛ Google وFacebook وMicrosoft Entra ID ورابط البريد (Resend).
- نماذج `User` (مع `role`) و`Account` و`Session` و`VerificationToken` في migration جديدة (`auth`).
- ترقية `ADMIN_EMAIL` تلقائياً عند الدخول، وتحديث `lastLoginAt`.
- `requireUser()` و`requireAdmin()` للأفعال، و`requireUserPage()` و`requireAdminPage()` للصفحات، وغلاف `adminAction` (Zod ثم فحص الدور) مع أول فعل إداري `adminPing`.
- `proxy.ts`: فحص تفاؤلي لكوكي الجلسة لـ `/account` و`/admin` مع next-intl؛ التحقق الحقيقي في الخادم.
- صفحة `/login` وصفحة التحقق من البريد، قائمة الحساب في الترويسة (عميل فقط ليبقى باقي الموقع ثابتاً)، تسجيل الخروج، `/account`، وهيكل `/admin` بقائمة جانبية فارغة.
- المزوّد غير المضبوط لا يظهر زره.

### معايير القبول

- [ ] الدخول بـ Google يعمل محلياً — **لم أتحقق: لا مفاتيح OAuth في هذه البيئة**
- [x] الدخول برابط البريد: جُرّب من البداية للنهاية (طلب الرابط، فتحه، العودة لـ `/ar/account`، ترقية المدير)
- [x] مستخدم USER يُرفض من `/admin` (404 في E2E) ومن Server Action إداري (اختبار وحدة)
- [x] الزائر يُحوَّل من `/account` إلى `/login` ثم يعود بعد الدخول
- [x] المزوّد غير المضبوط لا يظهر زره (E2E)

### قرارات

- **الترقية إلى ADMIN** تتم فقط عبر Google أو رابط البريد، لا عبر Facebook/Microsoft: بريدهما غير مضمون التوثيق (ثغرة nOAuth)، فمن يملك حساباً ببريد المدير قد يرتقي.
- **ربط الحسابات تلقائياً بالبريد لـ Google فقط** (يتطلب `email_verified`). Facebook وMicrosoft لا يُربطان تلقائياً؛ من له حساب بهما يدخل أولاً برابط البريد. هذا انحراف مقصود عن §6 (الربط عند بريد «مُتحقَّق منه») لأن توثيقهما غير مضمون.
- **منع pre-hijacking:** عند إثبات بريد عبر Google أو رابط البريد وكان لذلك البريد مستخدم غير موثّق، تُحذف حساباته وجلساته المرتبطة ثم يُوثَّق البريد (`adopt-verified-email.ts`).
- **رابط البريد خارج الإنتاج** يعمل دائماً بدون Resend ويطبع الرابط في طرفية الخادم (للتطوير فقط)؛ في الإنتاج يلزم Resend وإلا يختفي النموذج.
- **Turnstile وrate limit على رابط الدخول** (§13) مؤجلان إلى المرحلة 4 مع بقية النماذج العامة التي تشاركها نفس الأدوات (Upstash وTurnstile). لا يُعدّ الدخول بالبريد محمياً من الإساءة قبل ذلك.
- `/admin` لغير المدير يعيد 404 (لا يكشف وجوده)، والزائر يُحوَّل إلى `/login`.
- مكتبات جديدة (كلها في القائمة): `next-auth@5.0.0-beta.32`، `@auth/prisma-adapter`، `resend`، `@react-email/components`، `zod`، `react-hook-form`، `@hookform/resolvers`.
- اختبارات E2E تحتاج `AUTH_SECRET` وقاعدة بيانات؛ إضافتها إلى الـ CI في المرحلة 7.

### المتبقي

- تجربة الدخول بـ Google ببيانات OAuth حقيقية (عندك).
