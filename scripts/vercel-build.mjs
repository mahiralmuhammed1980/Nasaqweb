// أمر البناء على Vercel (يُفضَّل تلقائياً على "build" إن وُجد script باسم vercel-build).
// - الإنتاج فقط: يطبّق الـ migrations المعلّقة قبل البناء (البناء نفسه يقرأ قاعدة البيانات لتوليد الصفحات الثابتة).
// - المعاينات (Preview) وأي فرع غير الإنتاج: لا تعدّل مخطط قاعدة البيانات أبداً.
import { spawnSync } from "node:child_process";

const env = process.env;
const productionBranch = env.PRODUCTION_BRANCH ?? "main";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// البناء يقرأ قاعدة البيانات، فنفشل مبكراً برسالة واضحة بدل خطأ Prisma الغامض.
// DIRECT_URL اختياري: prisma.config.ts يعود إلى DATABASE_URL عند غيابه (كافٍ حين يكون الرابط مباشراً بصيغة postgres://).
const missing = ["DATABASE_URL"].filter((name) => !env[name]);
if (missing.length > 0) {
  console.error(
    `[vercel-build] Missing environment variables: ${missing.join(", ")}`,
  );
  console.error(
    "[vercel-build] Add them in Vercel > Project > Settings > Environment Variables, then redeploy.",
  );
  process.exit(1);
}

run("pnpm", ["exec", "prisma", "generate"]);

// حارسان معاً: بيئة الإنتاج + فرع الإنتاج. فرع آخر لا يُجري migrations حتى لو وُسم production خطأً.
const branch = env.VERCEL_GIT_COMMIT_REF;
const isProduction =
  env.VERCEL_ENV === "production" && (!branch || branch === productionBranch);

if (isProduction) {
  console.log(
    `[vercel-build] production (${branch ?? "no git ref"}): applying pending migrations`,
  );
  run("pnpm", ["exec", "prisma", "migrate", "deploy"]);
} else {
  console.log(
    `[vercel-build] skipping migrations (VERCEL_ENV=${env.VERCEL_ENV ?? "unset"}, branch=${branch ?? "unset"})`,
  );
}

run("pnpm", ["exec", "next", "build"]);
