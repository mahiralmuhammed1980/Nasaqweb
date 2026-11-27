import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];
const PROTECTED = /^\/(ar|en)\/(account|admin)(\/|$)/;

/**
 * فحص تفاؤلي سريع: لا كوكي جلسة ← إلى /login. التحقق الحقيقي من الجلسة والدور
 * يتم دائماً في الخادم (layout الصفحة و requireAdmin في الأفعال).
 */
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const match = PROTECTED.exec(pathname);
  if (match) {
    const hasSession = SESSION_COOKIES.some((name) =>
      request.cookies.has(name),
    );
    if (!hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = `/${match[1]}/login`;
      url.search = `?callbackUrl=${encodeURIComponent(pathname + search)}`;
      return NextResponse.redirect(url);
    }
  }
  return intlMiddleware(request);
}

export const config = {
  // كل المسارات عدا api والملفات الثابتة
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
