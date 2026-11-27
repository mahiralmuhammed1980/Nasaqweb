import { notFound } from "next/navigation";

// أي مسار غير معروف داخل لغة صحيحة يعرض صفحة 404 المخصّصة
export default function CatchAll() {
  notFound();
}
