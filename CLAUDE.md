# CLAUDE.md

## المشروع

موقع لعرض التطبيقات التي أبيعها: تطبيقات سطح مكتب (EXE)، وتطبيقات ويب (SaaS)، وتطبيقات أندرويد (APK)، إضافة إلى أجهزة مرتبطة بها (طابعات باركود، قارئات، طابعات فواتير...).
لا يوجد دفع إلكتروني حالياً. الزبون يطلب، وأنا أتواصل معه.

- المواصفات الكاملة: `docs/SPEC.md`. **اقرأ القسم المتعلق بالمهمة قبل أي ميزة جديدة.**
- سجل التقدم والقرارات: `docs/PROGRESS.md`. حدّثه في نهاية كل مرحلة.

## التقنيات (لا تغيّرها ولا تضف بديلاً دون أن تسألني)

- Next.js (App Router) + TypeScript بوضع strict
- Tailwind CSS + shadcn/ui
- next-intl: العربية افتراضية (RTL) والإنجليزية ثانية (LTR)
- PostgreSQL + Prisma
- Auth.js v5: Google، Facebook، Microsoft، ورابط دخول بالبريد (عبر Resend)
- Zod للتحقق، react-hook-form للنماذج
- Resend + React Email للبريد
- PostHog للتحليلات (لا يُحمَّل قبل موافقة المستخدم)
- Cloudflare R2 (متوافق مع S3) لرفع الصور
- Cloudflare Turnstile + Upstash Ratelimit لحماية النماذج العامة
- Vitest لاختبارات الوحدات، Playwright لاختبارات E2E
- pnpm مدير الحزم، Vercel للنشر، GitHub Actions للـ CI

## الأوامر

```bash
pnpm install          # تثبيت الحزم
pnpm dev              # تشغيل محلي
pnpm build            # بناء الإنتاج
pnpm lint             # ESLint
pnpm typecheck        # tsc --noEmit
pnpm test             # Vitest
pnpm test:e2e         # Playwright
pnpm db:migrate       # prisma migrate dev
pnpm db:seed          # بيانات تجريبية
pnpm db:studio        # Prisma Studio
```

قبل أي commit يجب أن تنجح: `pnpm lint && pnpm typecheck && pnpm test`.

## هيكل المجلدات

```
src/
  app/
    [locale]/
      (public)/        # الصفحات العامة
      (account)/       # صفحات حساب المستخدم
      admin/           # لوحة التحكم (ADMIN فقط)
    api/               # route handlers (auth، webhooks)
  components/
    ui/                # مكونات shadcn
    ...                # مكونات الموقع مقسمة حسب الميزة
  lib/                 # db.ts، auth.ts، analytics/، email/، storage/، utils
  server/
    actions/           # Server Actions (كل عمليات الكتابة)
    queries/           # دوال القراءة من قاعدة البيانات
  validators/          # مخططات Zod مشتركة
messages/              # ar.json، en.json
prisma/                # schema.prisma، migrations/، seed.ts
docs/                  # SPEC.md، PROGRESS.md
e2e/                   # اختبارات Playwright
```

## قواعد الكود

- TypeScript strict، ممنوع `any`.
- Server Components افتراضياً، و`"use client"` فقط عند الحاجة الفعلية للتفاعل.
- كل عملية كتابة تمر عبر Server Action في `src/server/actions`، وتبدأ بالتحقق بـ Zod ثم فحص الصلاحية داخل الدالة نفسها.
- لا نصوص ثابتة في الواجهة. كل نص عبر next-intl، ويُضاف إلى `ar.json` و`en.json` معاً.
- RTL: استخدم الخصائص المنطقية في Tailwind (`ms-` `me-` `ps-` `pe-` `start-` `end-` `text-start`) ولا تستخدم `ml-` `mr-` `left-` `right-`. الأيقونات الاتجاهية (الأسهم) تنقلب في RTL.
- الخط: IBM Plex Sans Arabic عبر `next/font`.
- المحتوى القابل للترجمة في قاعدة البيانات يُخزَّن في جداول `*Translation` (انظر SPEC §10).
- أسماء الملفات kebab-case، والمكوّنات PascalCase.
- الصور عبر `next/image`. الفيديو يُعرض بواجهة خفيفة (facade) ولا يُحمَّل المشغّل إلا عند النقر.
- بعد أي حفظ من لوحة التحكم استدعِ `revalidatePath` أو `revalidateTag` للصفحات المتأثرة.

## قواعد لا تُخالف

1. **الصلاحيات تُفحص في الخادم دائماً.** كل صفحة وكل Server Action تحت `/admin` تتطلب `role = ADMIN`. إخفاء الزر في الواجهة لا يكفي.
2. **لا PostHog ولا كوكيز تحليل قبل موافقة المستخدم** على شريط الكوكيز.
3. **الموافقة التسويقية مستقلة** عن تسجيل الدخول وعن الكوكيز. هي خانة اختيارية غير محددة مسبقاً، وتُحفظ كسجل تاريخي في `ConsentRecord`: لا تعدّل السجلات القديمة، بل أضف سجلاً جديداً. التصدير التسويقي يشمل من موافقتهم الحالية سارية فقط.
4. **لا بيانات شخصية في السجلات (logs) ولا في أحداث PostHog.** لا بريد ولا هاتف ولا اسم، بل المعرّف الداخلي فقط.
5. الأسرار في متغيرات البيئة فقط. أي متغير جديد يُضاف إلى `.env.example` مع وصف.
6. أي Markdown قادم من لوحة التحكم يُعقَّم قبل عرضه.
7. النماذج العامة (الطلب، التواصل) تمر عبر: Turnstile ثم rate limit ثم Zod.
8. المعاينة الحية تعرض `demoUrl` (نسخة تجريبية) فقط، وليس نسخة الإنتاج من أي تطبيق.

## طريقة العمل

- نفّذ مرحلة واحدة في كل مرة حسب `docs/SPEC.md` §15. لا تبدأ مرحلة قبل انتهاء السابقة.
- قبل البدء: اقرأ قسم المرحلة واكتب خطة مختصرة بالخطوات.
- بعد كل ميزة: اكتب الاختبارات أو حدّثها، وشغّل lint وtypecheck وtest، وأصلح الأخطاء قبل الانتقال.
- المرحلة **منتهية** فقط عندما تتحقق كل معايير القبول المكتوبة لها في SPEC.
- في نهاية كل مرحلة: حدّث `docs/PROGRESS.md` بما أُنجز، وما تبقى، والقرارات التي اتخذتها.
- أي تغيير في مخطط قاعدة البيانات يكون migration جديدة. لا تعدّل migrations قديمة.
- commits صغيرة بصيغة Conventional Commits (`feat:` `fix:` `chore:` `refactor:` `test:` `docs:`)، وفرع لكل مرحلة (`phase-2-catalog` مثلاً) ثم Pull Request.
- إن وجدت غموضاً أو تعارضاً في SPEC: اسألني. وإن لم أكن متاحاً، اختر الحل الأبسط وسجّل القرار وسببه في `PROGRESS.md`.
- لا تضف مكتبة خارج القائمة أعلاه دون ذكر السبب في PR.

## البيانات التجريبية (seed)

- 3 منتجات (واحد لكل نوع: EXE وSaaS وAPK) بميزات وصور وخطط أسعار
- عرض خصم واحد ساري
- قطعتا هاردوير مربوطتان بالمنتجات
- فيديو تعليمي ومقال
- حساب المدير يُنشأ أو يُرقّى من `ADMIN_EMAIL`
