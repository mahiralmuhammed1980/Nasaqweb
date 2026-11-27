"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import { whatsappUrl } from "@/lib/whatsapp";

type Ctx = {
  number: string | null;
  productName: string | null;
  setProductName: (name: string | null) => void;
};
const WhatsAppContext = createContext<Ctx>({
  number: null,
  productName: null,
  setProductName: () => {},
});

/** يمرّر رقم واتساب (من الإعدادات) ويتذكر اسم المنتج الحالي لتعبئة الرسالة. */
export function WhatsAppProvider({
  number,
  children,
}: {
  number: string | null;
  children: ReactNode;
}) {
  const [productName, setProductName] = useState<string | null>(null);
  return (
    <WhatsAppContext.Provider value={{ number, productName, setProductName }}>
      {children}
    </WhatsAppContext.Provider>
  );
}

/** تضعه صفحة المنتج ليعرف الزر العائم اسم المنتج. */
export function WhatsAppProduct({ name }: { name: string }) {
  const { setProductName } = useContext(WhatsAppContext);
  useEffect(() => {
    setProductName(name);
    return () => setProductName(null);
  }, [name, setProductName]);
  return null;
}

/** زر واتساب عائم في كل الصفحات، لا يظهر إن لم يُضبط الرقم. رسالته تتضمن اسم المنتج في صفحة المنتج. */
export function WhatsAppFloating() {
  const t = useTranslations("WhatsApp");
  const pathname = usePathname();
  const { number, productName } = useContext(WhatsAppContext);
  const onProductPage = /^\/products\/[^/]+$/.test(pathname);
  const url = whatsappUrl(
    number,
    productName && onProductPage
      ? t("productMessage", { name: productName })
      : t("defaultMessage"),
  );
  if (!url || pathname.startsWith("/admin")) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("float")}
      // في صفحة المنتج على الجوال يوجد شريط سفلي فيه زر واتساب، فنرفع الزر العائم فوقه
      className={`fixed end-4 z-30 flex size-14 items-center justify-center rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 ${onProductPage ? "bottom-24 md:bottom-4" : "bottom-4"}`}
    >
      <MessageCircle className="size-7" aria-hidden />
    </a>
  );
}

/** زر واتساب نصي (ترويسة المنتج والشريط السفلي) برسالة تتضمن المنتج. */
export function WhatsAppButton({
  productName,
  className,
}: {
  productName: string;
  className?: string;
}) {
  const t = useTranslations("WhatsApp");
  const { number } = useContext(WhatsAppContext);
  const url = whatsappUrl(number, t("productMessage", { name: productName }));
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {t("button")}
    </a>
  );
}
