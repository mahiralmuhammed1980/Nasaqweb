// أمر البناء على Vercel (يُفضَّل تلقائياً على "build" إن وُجد script باسم vercel-build).
// - الإنتاج فقط: يطبّق الـ migrations المعلّقة قبل البناء (البناء نفسه يقرأ قاعدة البيانات لتوليد الصفحات الثابتة).
// - المعاينات (Preview): لا تعدّل مخطط قاعدة البيانات أبداً، حتى لا تغيّر قاعدة الإنتاج عن طريق الخطأ.
import { spawnSync } from "node:child_process";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("pnpm", ["exec", "prisma", "generate"]);

if (process.env.VERCEL_ENV === "production") {
  console.log("[vercel-build] production: applying pending migrations");
  run("pnpm", ["exec", "prisma", "migrate", "deploy"]);
} else {
  console.log(
    `[vercel-build] skipping migrations (VERCEL_ENV=${process.env.VERCEL_ENV ?? "unset"})`,
  );
}

run("pnpm", ["exec", "next", "build"]);
