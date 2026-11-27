import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

type Tr<T> = { ar: T; en: T };

const categories: { slug: string; sortOrder: number; name: Tr<string> }[] = [
  {
    slug: "accounting",
    sortOrder: 1,
    name: { ar: "محاسبة", en: "Accounting" },
  },
  {
    slug: "restaurants",
    sortOrder: 2,
    name: { ar: "مطاعم", en: "Restaurants" },
  },
  {
    slug: "pharmacies",
    sortOrder: 3,
    name: { ar: "صيدليات", en: "Pharmacies" },
  },
];

type SeedProduct = {
  slug: string;
  type: "EXE" | "SAAS" | "APK";
  category: string;
  featured: boolean;
  sortOrder: number;
  priceType: "FIXED" | "FROM" | "ON_REQUEST";
  price?: number;
  version?: string;
  platforms: string;
  cover: string;
  demo?: {
    url: string;
    username: string;
    password: string;
    embeddable: boolean;
  };
  video?: { provider: "YOUTUBE"; id: string };
  trialDownloadUrl?: string;
  name: Tr<string>;
  tagline: Tr<string>;
  description: Tr<string>;
  features: { icon: string; title: Tr<string>; description: Tr<string> }[];
  plans: {
    price: number;
    period: "ONE_TIME" | "MONTHLY" | "YEARLY";
    highlighted: boolean;
    name: Tr<string>;
    features: Tr<string[]>;
  }[];
  faqs: { question: Tr<string>; answer: Tr<string> }[];
  shots: { altAr: string; altEn: string }[];
};

const products: SeedProduct[] = [
  {
    slug: "desktop-accounting",
    type: "EXE",
    category: "accounting",
    featured: true,
    sortOrder: 1,
    priceType: "FIXED",
    price: 299,
    version: "2.4",
    platforms: "Windows 10+",
    cover: "/seed/exe-cover.png",
    video: { provider: "YOUTUBE", id: "M7lc1UVf-VE" },
    trialDownloadUrl: "https://example.com/trial/desktop-accounting.exe",
    name: { ar: "نظام المحاسبة المكتبي", en: "Desktop Accounting" },
    tagline: {
      ar: "محاسبة كاملة تعمل بدون إنترنت على حاسوبك",
      en: "Full accounting that works offline on your PC",
    },
    description: {
      ar: "## نظرة عامة\nنظام محاسبة متكامل يعمل على **سطح المكتب** بدون حاجة للإنترنت.\n\n- فواتير مبيعات ومشتريات\n- تقارير الأرباح والمخزون\n- نسخ احتياطي تلقائي",
      en: "## Overview\nA complete accounting system that runs on your **desktop** with no internet needed.\n\n- Sales and purchase invoices\n- Profit and inventory reports\n- Automatic backups",
    },
    features: [
      {
        icon: "FileText",
        title: { ar: "فواتير سريعة", en: "Fast invoices" },
        description: {
          ar: "أنشئ فاتورة في ثوانٍ وأرسلها للطباعة.",
          en: "Create an invoice in seconds and print it.",
        },
      },
      {
        icon: "BarChart3",
        title: { ar: "تقارير دقيقة", en: "Accurate reports" },
        description: {
          ar: "أرباح ومبيعات ومخزون لحظياً.",
          en: "Live profit, sales and stock.",
        },
      },
      {
        icon: "HardDrive",
        title: { ar: "نسخ احتياطي", en: "Backups" },
        description: {
          ar: "نسخ تلقائي لبياناتك يومياً.",
          en: "Automatic daily data backups.",
        },
      },
      {
        icon: "WifiOff",
        title: { ar: "يعمل بدون إنترنت", en: "Works offline" },
        description: {
          ar: "لا تتوقف أعمالك عند انقطاع الاتصال.",
          en: "Keep working when the connection drops.",
        },
      },
    ],
    plans: [
      {
        price: 299,
        period: "ONE_TIME",
        highlighted: false,
        name: { ar: "أساسي", en: "Basic" },
        features: {
          ar: ["مستخدم واحد", "فواتير وتقارير"],
          en: ["One user", "Invoices and reports"],
        },
      },
      {
        price: 499,
        period: "ONE_TIME",
        highlighted: true,
        name: { ar: "احترافي", en: "Professional" },
        features: {
          ar: ["حتى 5 مستخدمين", "فروع متعددة", "دعم أولوية"],
          en: ["Up to 5 users", "Multiple branches", "Priority support"],
        },
      },
    ],
    faqs: [
      {
        question: { ar: "هل أحتاج إنترنت؟", en: "Do I need internet?" },
        answer: {
          ar: "لا، يعمل بالكامل بدون إنترنت.",
          en: "No, it works fully offline.",
        },
      },
      {
        question: { ar: "هل التحديثات مجانية؟", en: "Are updates free?" },
        answer: {
          ar: "نعم، لسنة كاملة من الشراء.",
          en: "Yes, for one year from purchase.",
        },
      },
    ],
    shots: [
      { altAr: "لوحة المبيعات", altEn: "Sales dashboard" },
      { altAr: "شاشة الفاتورة", altEn: "Invoice screen" },
      { altAr: "تقرير الأرباح", altEn: "Profit report" },
    ],
  },
  {
    slug: "restaurant-saas",
    type: "SAAS",
    category: "restaurants",
    featured: true,
    sortOrder: 2,
    priceType: "FROM",
    price: 29,
    platforms: "Web",
    cover: "/seed/saas-cover.png",
    demo: {
      url: "https://example.com/",
      username: "demo@example.com",
      password: "demo1234",
      embeddable: true,
    },
    name: { ar: "نظام إدارة المطاعم السحابي", en: "Cloud Restaurant Manager" },
    tagline: {
      ar: "الطلبات والمطبخ والمخزون في لوحة واحدة",
      en: "Orders, kitchen and stock in one dashboard",
    },
    description: {
      ar: "## لإدارة مطعمك\nمن أي جهاز وفي أي وقت.\n\n- نقاط بيع وطاولات\n- شاشة مطبخ\n- تقارير يومية",
      en: "## Run your restaurant\nFrom any device, any time.\n\n- POS and tables\n- Kitchen display\n- Daily reports",
    },
    features: [
      {
        icon: "UtensilsCrossed",
        title: { ar: "إدارة الطاولات", en: "Table management" },
        description: {
          ar: "تابع كل طاولة وطلبها.",
          en: "Track every table and order.",
        },
      },
      {
        icon: "ChefHat",
        title: { ar: "شاشة المطبخ", en: "Kitchen display" },
        description: {
          ar: "الطلبات تصل للمطبخ فوراً.",
          en: "Orders reach the kitchen instantly.",
        },
      },
      {
        icon: "Boxes",
        title: { ar: "مخزون ذكي", en: "Smart inventory" },
        description: {
          ar: "تنبيه عند نفاد المكونات.",
          en: "Alerts when ingredients run low.",
        },
      },
      {
        icon: "Cloud",
        title: { ar: "سحابي", en: "Cloud-based" },
        description: {
          ar: "بدون تثبيت وبتحديثات تلقائية.",
          en: "No install, automatic updates.",
        },
      },
    ],
    plans: [
      {
        price: 29,
        period: "MONTHLY",
        highlighted: false,
        name: { ar: "أساسي", en: "Basic" },
        features: {
          ar: ["فرع واحد", "5 مستخدمين"],
          en: ["One branch", "5 users"],
        },
      },
      {
        price: 59,
        period: "MONTHLY",
        highlighted: true,
        name: { ar: "احترافي", en: "Professional" },
        features: {
          ar: ["3 فروع", "مستخدمون غير محدودون", "شاشة مطبخ"],
          en: ["3 branches", "Unlimited users", "Kitchen display"],
        },
      },
      {
        price: 590,
        period: "YEARLY",
        highlighted: false,
        name: { ar: "سنوي", en: "Yearly" },
        features: {
          ar: ["كل ميزات الاحترافي", "شهران مجاناً"],
          en: ["All Professional features", "Two months free"],
        },
      },
    ],
    faqs: [
      {
        question: {
          ar: "هل يمكنني التجربة قبل الاشتراك؟",
          en: "Can I try before subscribing?",
        },
        answer: {
          ar: "نعم، عبر النسخة التجريبية في هذه الصفحة.",
          en: "Yes, using the live demo on this page.",
        },
      },
      {
        question: { ar: "أين تُحفظ بياناتي؟", en: "Where is my data stored?" },
        answer: {
          ar: "على خوادم آمنة مع نسخ احتياطي يومي.",
          en: "On secure servers with daily backups.",
        },
      },
    ],
    shots: [
      { altAr: "لوحة الطلبات", altEn: "Orders board" },
      { altAr: "شاشة المطبخ", altEn: "Kitchen screen" },
      { altAr: "تقرير المبيعات", altEn: "Sales report" },
    ],
  },
  {
    slug: "pos-android",
    type: "APK",
    category: "pharmacies",
    featured: false,
    sortOrder: 3,
    priceType: "ON_REQUEST",
    version: "1.2",
    platforms: "Android 8+",
    cover: "/seed/apk-cover.png",
    video: { provider: "YOUTUBE", id: "M7lc1UVf-VE" },
    trialDownloadUrl: "https://example.com/trial/pos-android.apk",
    name: { ar: "نقطة بيع الصيدلية للجوال", en: "Pharmacy POS for Android" },
    tagline: {
      ar: "بِع وتابع مخزونك من هاتفك",
      en: "Sell and track stock from your phone",
    },
    description: {
      ar: "## بيع من أي مكان\nتطبيق أندرويد خفيف يربط الباركود بالمخزون.\n\n- مسح الباركود بالكاميرا\n- طباعة فاتورة على طابعة بلوتوث",
      en: "## Sell anywhere\nA lightweight Android app linking barcodes to stock.\n\n- Barcode scanning with the camera\n- Print receipts on a Bluetooth printer",
    },
    features: [
      {
        icon: "ScanBarcode",
        title: { ar: "مسح الباركود", en: "Barcode scanning" },
        description: {
          ar: "بالكاميرا أو بقارئ خارجي.",
          en: "With the camera or an external reader.",
        },
      },
      {
        icon: "Printer",
        title: { ar: "طباعة فورية", en: "Instant printing" },
        description: {
          ar: "طابعات بلوتوث وفواتير حرارية.",
          en: "Bluetooth and thermal receipt printers.",
        },
      },
      {
        icon: "Pill",
        title: { ar: "إدارة الأدوية", en: "Medicine tracking" },
        description: {
          ar: "تواريخ الانتهاء والدفعات.",
          en: "Expiry dates and batches.",
        },
      },
    ],
    plans: [],
    faqs: [
      {
        question: { ar: "هل يعمل بدون إنترنت؟", en: "Does it work offline?" },
        answer: {
          ar: "نعم، ويزامن عند عودة الاتصال.",
          en: "Yes, and it syncs when back online.",
        },
      },
    ],
    shots: [
      { altAr: "شاشة البيع", altEn: "Sales screen" },
      { altAr: "مسح الباركود", altEn: "Barcode scan" },
      { altAr: "المخزون", altEn: "Stock list" },
    ],
  },
];

async function seedCategories() {
  const ids = new Map<string, string>();
  for (const c of categories) {
    const category = await db.category.upsert({
      where: { slug: c.slug },
      update: { sortOrder: c.sortOrder },
      create: { slug: c.slug, sortOrder: c.sortOrder },
    });
    ids.set(c.slug, category.id);
    for (const locale of ["ar", "en"] as const) {
      await db.categoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: category.id, locale } },
        update: { name: c.name[locale] },
        create: { categoryId: category.id, locale, name: c.name[locale] },
      });
    }
  }
  return ids;
}

async function seedProduct(p: SeedProduct, categoryId: string) {
  const data = {
    type: p.type,
    status: "PUBLISHED" as const,
    categoryId,
    priceType: p.priceType,
    price: p.price ?? null,
    featured: p.featured,
    sortOrder: p.sortOrder,
    version: p.version ?? null,
    platforms: p.platforms,
    coverImage: p.cover,
    demoUrl: p.demo?.url ?? null,
    demoUsername: p.demo?.username ?? null,
    demoPassword: p.demo?.password ?? null,
    demoEmbeddable: p.demo?.embeddable ?? true,
    videoProvider: p.video?.provider ?? null,
    videoId: p.video?.id ?? null,
    trialDownloadUrl: p.trialDownloadUrl ?? null,
    publishedAt: new Date(),
  };
  const product = await db.product.upsert({
    where: { slug: p.slug },
    update: data,
    create: { slug: p.slug, ...data },
  });

  // نعيد بناء الأبناء ليبقى السيد (seed) متكرر التشغيل
  await db.$transaction([
    db.productTranslation.deleteMany({ where: { productId: product.id } }),
    db.productFeature.deleteMany({ where: { productId: product.id } }),
    db.productMedia.deleteMany({ where: { productId: product.id } }),
    db.productPlan.deleteMany({ where: { productId: product.id } }),
    db.productFaq.deleteMany({ where: { productId: product.id } }),
  ]);

  for (const locale of ["ar", "en"] as const) {
    await db.productTranslation.create({
      data: {
        productId: product.id,
        locale,
        name: p.name[locale],
        tagline: p.tagline[locale],
        description: p.description[locale],
      },
    });
  }

  for (const [index, f] of p.features.entries()) {
    await db.productFeature.create({
      data: {
        productId: product.id,
        icon: f.icon,
        sortOrder: index,
        translations: {
          create: (["ar", "en"] as const).map((locale) => ({
            locale,
            title: f.title[locale],
            description: f.description[locale],
          })),
        },
      },
    });
  }

  for (const [index, s] of p.shots.entries()) {
    const key = p.type.toLowerCase();
    await db.productMedia.create({
      data: {
        productId: product.id,
        url: `/seed/${key}-shot-${index + 1}.png`,
        sortOrder: index,
        altAr: s.altAr,
        altEn: s.altEn,
      },
    });
  }

  for (const [index, plan] of p.plans.entries()) {
    await db.productPlan.create({
      data: {
        productId: product.id,
        price: plan.price,
        billingPeriod: plan.period,
        highlighted: plan.highlighted,
        sortOrder: index,
        translations: {
          create: (["ar", "en"] as const).map((locale) => ({
            locale,
            name: plan.name[locale],
            features: plan.features[locale],
          })),
        },
      },
    });
  }

  for (const [index, faq] of p.faqs.entries()) {
    await db.productFaq.create({
      data: {
        productId: product.id,
        sortOrder: index,
        translations: {
          create: (["ar", "en"] as const).map((locale) => ({
            locale,
            question: faq.question[locale],
            answer: faq.answer[locale],
          })),
        },
      },
    });
  }
}

const hardwareCategories: {
  slug: string;
  sortOrder: number;
  name: Tr<string>;
}[] = [
  {
    slug: "barcode-printers",
    sortOrder: 1,
    name: { ar: "طابعات باركود", en: "Barcode printers" },
  },
  {
    slug: "barcode-scanners",
    sortOrder: 2,
    name: { ar: "قارئات باركود", en: "Barcode scanners" },
  },
];

const hardwareItems = [
  {
    slug: "zebra-zd220",
    category: "barcode-printers",
    brand: "Zebra",
    model: "ZD220",
    priceType: "FIXED" as const,
    price: 189,
    inStock: true,
    images: ["/seed/printer.png"],
    name: { ar: "طابعة باركود حرارية", en: "Thermal Barcode Printer" },
    description: {
      ar: "طابعة ملصقات حرارية مباشرة مناسبة للمتاجر والصيدليات.",
      en: "A direct-thermal label printer suited to shops and pharmacies.",
    },
    specs: [
      { keyAr: "الدقة", keyEn: "Resolution", value: "203 dpi" },
      { keyAr: "الاتصال", keyEn: "Connectivity", value: "USB" },
      { keyAr: "سرعة الطباعة", keyEn: "Print speed", value: "102 mm/s" },
    ],
    products: ["restaurant-saas", "pos-android"],
  },
  {
    slug: "honeywell-voyager-1202g",
    category: "barcode-scanners",
    brand: "Honeywell",
    model: "Voyager 1202g",
    priceType: "ON_REQUEST" as const,
    price: null,
    inStock: true,
    images: ["/seed/scanner.png"],
    name: { ar: "قارئ باركود لاسلكي", en: "Wireless Barcode Scanner" },
    description: {
      ar: "قارئ باركود لاسلكي بالبلوتوث يعمل مع الجوال والحاسوب.",
      en: "A Bluetooth wireless barcode scanner that works with phones and PCs.",
    },
    specs: [
      { keyAr: "الاتصال", keyEn: "Connectivity", value: "Bluetooth" },
      { keyAr: "المدى", keyEn: "Range", value: "10 m" },
    ],
    products: ["desktop-accounting", "pos-android"],
  },
];

async function seedHardware() {
  const categoryIds = new Map<string, string>();
  for (const c of hardwareCategories) {
    const category = await db.hardwareCategory.upsert({
      where: { slug: c.slug },
      update: { sortOrder: c.sortOrder },
      create: { slug: c.slug, sortOrder: c.sortOrder },
    });
    categoryIds.set(c.slug, category.id);
    for (const locale of ["ar", "en"] as const) {
      await db.hardwareCategoryTranslation.upsert({
        where: { categoryId_locale: { categoryId: category.id, locale } },
        update: { name: c.name[locale] },
        create: { categoryId: category.id, locale, name: c.name[locale] },
      });
    }
  }

  for (const h of hardwareItems) {
    const data = {
      categoryId: categoryIds.get(h.category) ?? null,
      brand: h.brand,
      model: h.model,
      priceType: h.priceType,
      price: h.price,
      inStock: h.inStock,
      images: h.images,
      specs: h.specs,
      status: "PUBLISHED" as const,
    };
    const hardware = await db.hardware.upsert({
      where: { slug: h.slug },
      update: data,
      create: { slug: h.slug, ...data },
    });
    await db.hardwareTranslation.deleteMany({
      where: { hardwareId: hardware.id },
    });
    for (const locale of ["ar", "en"] as const) {
      await db.hardwareTranslation.create({
        data: {
          hardwareId: hardware.id,
          locale,
          name: h.name[locale],
          description: h.description[locale],
        },
      });
    }
    const products = await db.product.findMany({
      where: { slug: { in: h.products } },
      select: { id: true },
    });
    await db.hardwareProduct.deleteMany({ where: { hardwareId: hardware.id } });
    await db.hardwareProduct.createMany({
      data: products.map((p) => ({ hardwareId: hardware.id, productId: p.id })),
    });
  }
}

/** عرض خصم ساري واحد: يُجدَّد تاريخه في كل تشغيل للـ seed. */
async function seedOffer() {
  const day = 24 * 60 * 60 * 1000;
  const data = {
    discountType: "PERCENT" as const,
    discountValue: 20,
    startsAt: new Date(Date.now() - day),
    endsAt: new Date(Date.now() + 30 * day),
    isActive: true,
    bannerImage: "/seed/offer.png",
    couponCode: "LAUNCH20",
  };
  const offer = await db.offer.upsert({
    where: { slug: "launch-offer" },
    update: data,
    create: { slug: "launch-offer", ...data },
  });
  const text = {
    ar: {
      title: "عرض الإطلاق",
      description: "خصم 20% على تطبيقات مختارة لفترة محدودة.",
      terms: "- العرض لفترة محدودة\n- لا يُجمع مع عروض أخرى",
    },
    en: {
      title: "Launch offer",
      description: "20% off selected apps for a limited time.",
      terms: "- Limited time only\n- Cannot be combined with other offers",
    },
  };
  for (const locale of ["ar", "en"] as const) {
    await db.offerTranslation.upsert({
      where: { offerId_locale: { offerId: offer.id, locale } },
      update: text[locale],
      create: { offerId: offer.id, locale, ...text[locale] },
    });
  }
  const products = await db.product.findMany({
    where: { slug: { in: ["desktop-accounting", "restaurant-saas"] } },
    select: { id: true },
  });
  await db.offerProduct.deleteMany({ where: { offerId: offer.id } });
  await db.offerProduct.createMany({
    data: products.map((p) => ({ offerId: offer.id, productId: p.id })),
  });
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email)
    return console.log("seed: ADMIN_EMAIL غير مضبوط، تخطّي حساب المدير.");
  await db.user.upsert({
    where: { email },
    update: { role: "ADMIN" },
    create: { email, role: "ADMIN", emailVerified: new Date() },
  });
  console.log("seed: حساب المدير جاهز.");
}

async function main() {
  const categoryIds = await seedCategories();
  for (const p of products) {
    const categoryId = categoryIds.get(p.category);
    if (!categoryId) throw new Error(`unknown category ${p.category}`);
    await seedProduct(p, categoryId);
  }
  await seedHardware();
  await seedOffer();
  await seedAdmin();
  console.log(
    `seed: ${products.length} منتجات و${categories.length} تصنيفات وجهازان وعرض واحد.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
