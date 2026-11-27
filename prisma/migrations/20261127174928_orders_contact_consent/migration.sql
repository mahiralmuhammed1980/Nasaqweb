-- CreateEnum
CREATE TYPE "PreferredChannel" AS ENUM ('WHATSAPP', 'PHONE', 'EMAIL');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'CONTACTED', 'QUOTED', 'WON', 'LOST', 'SPAM');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('STATUS_CHANGE', 'NOTE', 'EMAIL_SENT');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('NEW', 'READ', 'HANDLED');

-- CreateEnum
CREATE TYPE "ConsentChannel" AS ENUM ('EMAIL', 'WHATSAPP', 'SMS');

-- CreateEnum
CREATE TYPE "ConsentSource" AS ENUM ('ONBOARDING', 'ORDER_FORM', 'CONTACT_FORM', 'ACCOUNT', 'UNSUBSCRIBE', 'ACCOUNT_DELETION');

-- CreateTable
CREATE TABLE "OrderRequest" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "productId" TEXT,
    "hardwareId" TEXT,
    "planId" TEXT,
    "offerId" TEXT,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneHasWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "email" TEXT,
    "company" TEXT,
    "city" TEXT,
    "country" TEXT,
    "preferredChannel" "PreferredChannel" NOT NULL,
    "message" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "locale" TEXT NOT NULL,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestActivity" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "payload" JSONB NOT NULL,
    "adminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'NEW',
    "userId" TEXT,
    "locale" TEXT NOT NULL,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "channel" "ConsentChannel" NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "source" "ConsentSource" NOT NULL,
    "policyVersion" INTEGER NOT NULL,
    "consentText" TEXT NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderRequest_number_key" ON "OrderRequest"("number");

-- CreateIndex
CREATE INDEX "OrderRequest_status_createdAt_idx" ON "OrderRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OrderRequest_productId_idx" ON "OrderRequest"("productId");

-- CreateIndex
CREATE INDEX "OrderRequest_hardwareId_idx" ON "OrderRequest"("hardwareId");

-- CreateIndex
CREATE INDEX "OrderRequest_createdAt_idx" ON "OrderRequest"("createdAt");

-- CreateIndex
CREATE INDEX "RequestActivity_requestId_createdAt_idx" ON "RequestActivity"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "ContactMessage_status_createdAt_idx" ON "ContactMessage"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ConsentRecord_email_channel_createdAt_idx" ON "ConsentRecord"("email", "channel", "createdAt");

-- CreateIndex
CREATE INDEX "ConsentRecord_phone_channel_createdAt_idx" ON "ConsentRecord"("phone", "channel", "createdAt");

-- CreateIndex
CREATE INDEX "ConsentRecord_userId_channel_createdAt_idx" ON "ConsentRecord"("userId", "channel", "createdAt");

-- AddForeignKey
ALTER TABLE "OrderRequest" ADD CONSTRAINT "OrderRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderRequest" ADD CONSTRAINT "OrderRequest_hardwareId_fkey" FOREIGN KEY ("hardwareId") REFERENCES "Hardware"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderRequest" ADD CONSTRAINT "OrderRequest_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ProductPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderRequest" ADD CONSTRAINT "OrderRequest_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderRequest" ADD CONSTRAINT "OrderRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestActivity" ADD CONSTRAINT "RequestActivity_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "OrderRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactMessage" ADD CONSTRAINT "ContactMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- أرقام الطلبات المقروءة تبدأ من 1001 (الطلب الأول = 1001)
ALTER SEQUENCE "OrderRequest_number_seq" RESTART WITH 1001;

-- ConsentRecord سجل تاريخي للإضافة فقط: لا تعديل ولا حذف أبداً.
-- الحالة الحالية = آخر سجل لكل (شخص، قناة)، فتغيير الموافقة = إضافة سجل جديد.
CREATE OR REPLACE FUNCTION consent_record_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'ConsentRecord is append-only: % is not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER consent_record_no_update
  BEFORE UPDATE ON "ConsentRecord"
  FOR EACH ROW EXECUTE FUNCTION consent_record_append_only();

CREATE TRIGGER consent_record_no_delete
  BEFORE DELETE ON "ConsentRecord"
  FOR EACH ROW EXECUTE FUNCTION consent_record_append_only();
