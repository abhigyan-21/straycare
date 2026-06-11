-- Preserve existing data while moving the schema to the updated model layout.
-- Legacy columns are kept where possible so historical values remain available.

ALTER TABLE "Clinic" RENAME TO "Partner";
ALTER TABLE "FeedPost" RENAME TO "Post";

CREATE TYPE "PartnerType" AS ENUM ('NGO', 'SHELTER', 'VET', 'CLINIC');
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'SUSPENDED', 'REJECTED');
CREATE TYPE "RequestType" AS ENUM ('CAMPAIGN', 'SUPPORT_REQUEST');
CREATE TYPE "Urgency" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "DonationStatus" AS ENUM ('INITIATED', 'WEBHOOK_VERIFIED', 'REJECTED');
CREATE TYPE "CampaignCategory" AS ENUM ('TREATMENT', 'FOOD', 'SHELTER', 'RESCUE', 'OTHER');

ALTER TYPE "CampaignStatus" RENAME VALUE 'PENDING' TO 'DRAFT';
ALTER TYPE "CampaignStatus" RENAME VALUE 'APPROVED' TO 'ACTIVE';
ALTER TYPE "CampaignStatus" RENAME VALUE 'REJECTED' TO 'PAUSED';
ALTER TYPE "CampaignStatus" ADD VALUE 'ENDING_SOON';
ALTER TYPE "CampaignStatus" ADD VALUE 'EXPIRED';
ALTER TYPE "CampaignStatus" ADD VALUE 'COMPLETED';

ALTER TABLE "User" ADD COLUMN "partnerId" TEXT;

ALTER TABLE "Partner" ADD COLUMN "partnerType" "PartnerType" NOT NULL DEFAULT 'CLINIC';
ALTER TABLE "Partner" ADD COLUMN "state" TEXT;
ALTER TABLE "Partner" ADD COLUMN "pincode" TEXT;
ALTER TABLE "Partner" ADD COLUMN "phone" TEXT;
ALTER TABLE "Partner" ADD COLUMN "email" TEXT;
ALTER TABLE "Partner" ADD COLUMN "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Partner" ADD COLUMN "razorpayAccountId" TEXT;
ALTER TABLE "Partner" ADD COLUMN "commissionEligible" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Partner" ADD COLUMN "customCommissionRate" NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE "Partner" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "AnimalReport" ADD COLUMN "assignedPartnerId" TEXT;

ALTER TABLE "MedicalRecord" ADD COLUMN "partnerId" TEXT;

ALTER TABLE "Pet" ADD COLUMN "partnerId" TEXT;

ALTER TABLE "Campaign" ADD COLUMN "partnerId" TEXT;
ALTER TABLE "Campaign" ADD COLUMN "deadline" TIMESTAMP(3);
ALTER TABLE "Campaign" ADD COLUMN "requestType" "RequestType" NOT NULL DEFAULT 'CAMPAIGN';
ALTER TABLE "Campaign" ADD COLUMN "category" "CampaignCategory";
ALTER TABLE "Campaign" ADD COLUMN "urgency" "Urgency";
ALTER TABLE "Campaign" ADD COLUMN "animalsImpacted" INTEGER;
-- ALTER TABLE "Campaign" ADD COLUMN "theme" TEXT;
ALTER TABLE "Campaign" ALTER COLUMN "goalAmount" TYPE NUMERIC USING "goalAmount"::NUMERIC;
ALTER TABLE "Campaign" ALTER COLUMN "raisedAmount" TYPE NUMERIC USING "raisedAmount"::NUMERIC;
ALTER TABLE "Campaign" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Campaign" ALTER COLUMN "status" TYPE TEXT USING "status"::text;
ALTER TABLE "Campaign" RENAME COLUMN "status" TO "legacyStatus";
ALTER TABLE "Campaign" ADD COLUMN "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT';

ALTER TABLE "Donation" ADD COLUMN "partnerId" TEXT;
ALTER TABLE "Donation" ADD COLUMN "grossAmount" NUMERIC;
ALTER TABLE "Donation" ADD COLUMN "razorpayPaymentLinkId" TEXT;
ALTER TABLE "Donation" ADD COLUMN "razorpayPaymentId" TEXT;
ALTER TABLE "Donation" ADD COLUMN "platformFee" NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE "Donation" ADD COLUMN "platformFeePercentage" NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE "Donation" ADD COLUMN "netAmount" NUMERIC;
ALTER TABLE "Donation" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Donation" RENAME COLUMN "status" TO "legacyStatus";
ALTER TABLE "Donation" RENAME COLUMN "type" TO "legacyType";
ALTER TABLE "Donation" ADD COLUMN "status" "DonationStatus" NOT NULL DEFAULT 'INITIATED';

ALTER TABLE "Subscription" ADD COLUMN "partnerId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "razorpaySubscriptionId" TEXT;

ALTER TABLE "Post" ADD COLUMN "caption" TEXT;
ALTER TABLE "Post" ADD COLUMN "postImage" TEXT;
ALTER TABLE "Post" ADD COLUMN "location" TEXT;

ALTER TABLE "Comment" ADD COLUMN "userId" TEXT;
ALTER TABLE "Comment" ADD COLUMN "text" TEXT;

UPDATE "User"
SET "partnerId" = "clinicId"
WHERE "clinicId" IS NOT NULL;

UPDATE "Partner"
SET "verificationStatus" = CASE
  WHEN "isVerified" THEN 'VERIFIED'::"VerificationStatus"
  ELSE 'PENDING'::"VerificationStatus"
END;

UPDATE "Partner" p
SET "partnerType" = CASE
  WHEN EXISTS (
    SELECT 1
    FROM "User" u
    WHERE u."partnerId" = p."id"
      AND u."role" = 'NGO'
  ) THEN 'NGO'::"PartnerType"

  WHEN EXISTS (
    SELECT 1
    FROM "User" u
    WHERE u."partnerId" = p."id"
      AND u."role" = 'VET'
  ) THEN 'VET'::"PartnerType"

  ELSE 'CLINIC'::"PartnerType"
END;

UPDATE "AnimalReport"
SET "assignedPartnerId" = "assignedClinicId"
WHERE "assignedClinicId" IS NOT NULL;

UPDATE "MedicalRecord"
SET "partnerId" = "clinicId"
WHERE "clinicId" IS NOT NULL;

UPDATE "Pet"
SET "partnerId" = "clinicId"
WHERE "clinicId" IS NOT NULL;

UPDATE "Campaign"
SET "partnerId" = "clinicId",
    "deadline" = "endDate"
WHERE TRUE;

UPDATE "Campaign"
SET "legacyStatus" = COALESCE("legacyStatus", 'PENDING');

UPDATE "Campaign"
SET "status" = (
  CASE
    WHEN "legacyStatus" = 'APPROVED' THEN 'ACTIVE'
    WHEN "legacyStatus" = 'REJECTED' THEN 'PAUSED'
    ELSE 'DRAFT'
  END
)::"CampaignStatus";

UPDATE "Donation"
SET "partnerId" = "clinicId",
    "grossAmount" = "amount",
    "razorpayPaymentLinkId" = "paymentIntentId",
    "netAmount" = "amount",
    "legacyStatus" = COALESCE("legacyStatus", 'PENDING'),
    "legacyType" = "legacyType"
WHERE TRUE;

UPDATE "Donation"
SET "status" = CASE
  WHEN "legacyStatus" IN ('WEBHOOK_VERIFIED', 'COMPLETED', 'SUCCESS', 'PAID')
    THEN 'WEBHOOK_VERIFIED'::"DonationStatus"
  WHEN "legacyStatus" IN ('REJECTED', 'FAILED', 'CANCELLED')
    THEN 'REJECTED'::"DonationStatus"
  ELSE 'INITIATED'::"DonationStatus"
END;

UPDATE "Subscription"
SET "partnerId" = "clinicId",
    "razorpaySubscriptionId" = "stripeSubscriptionId"
WHERE "clinicId" IS NOT NULL;

UPDATE "Post"
SET "caption" = "content",
    "postImage" = COALESCE("mediaUrls"[1], ''),
    "location" = NULL;

UPDATE "Comment"
SET "userId" = "authorId",
    "text" = "content";

DO $$
DECLARE
  fallback_partner_id TEXT := '00000000-0000-0000-0000-000000000101';
  fallback_user_id TEXT := '00000000-0000-0000-0000-000000000102';
  fallback_campaign_id TEXT := '00000000-0000-0000-0000-000000000103';
  chosen_user_id TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM "Pet" WHERE "partnerId" IS NULL)
     OR EXISTS (SELECT 1 FROM "Donation" WHERE "partnerId" IS NULL)
     OR NOT EXISTS (SELECT 1 FROM "Partner") THEN
    INSERT INTO "Partner" (
      "id",
      "partnerType",
      "name",
      "address",
      "city",
      "state",
      "pincode",
      "lat",
      "lng",
      "phone",
      "email",
      "verificationStatus",
      "razorpayAccountId",
      "commissionEligible",
      "customCommissionRate",
      "createdAt",
      "updatedAt",
      "contact",
      "isVerified"
    )
    VALUES (
      fallback_partner_id,
      'CLINIC',
      'Legacy Partner',
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      'PENDING',
      NULL,
      false,
      0,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP,
      NULL,
      false
    )
    ON CONFLICT ("id") DO NOTHING;

    UPDATE "Pet"
    SET "partnerId" = fallback_partner_id
    WHERE "partnerId" IS NULL;

    UPDATE "Campaign"
    SET "partnerId" = fallback_partner_id
    WHERE "partnerId" IS NULL;

    UPDATE "MedicalRecord"
    SET "partnerId" = fallback_partner_id
    WHERE "partnerId" IS NULL;

    UPDATE "Subscription"
    SET "partnerId" = fallback_partner_id
    WHERE "partnerId" IS NULL;

    UPDATE "Donation"
    SET "partnerId" = fallback_partner_id
    WHERE "partnerId" IS NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM "Donation" WHERE "campaignId" IS NULL) THEN
    SELECT "id" INTO chosen_user_id FROM "User" ORDER BY "createdAt" ASC LIMIT 1;

    IF chosen_user_id IS NULL THEN
      chosen_user_id := fallback_user_id;
      INSERT INTO "User" (
        "id",
        "name",
        "email",
        "password",
        "role",
        "status",
        "avatarUrl",
        "refreshToken",
        "createdAt",
        "updatedAt",
        "contact",
        "emailOtp",
        "emailOtpExpiry",
        "isEmailVerified",
        "isPhoneVerified",
        "phone",
        "phoneOtp",
        "phoneOtpExpiry",
        "partnerId"
      )
      VALUES (
        fallback_user_id,
        'System',
        'system@straycare.local',
        'placeholder-password',
        'ADMIN',
        'Active',
        NULL,
        NULL,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        NULL,
        NULL,
        NULL,
        true,
        true,
        '0000000000',
        NULL,
        NULL,
        NULL
      )
      ON CONFLICT ("id") DO NOTHING;
    END IF;

    INSERT INTO "Campaign" (
      "id",
      "title",
      "description",
      "goalAmount",
      "raisedAmount",
      "partnerId",
      "reportId",
      "createdBy",
      "status",
      "banner",
      "image",
      "location",
      "purpose",
      "startDate",
      "startTime",
      "theme",
      "createdAt",
      "updatedAt",
      "requestType",
      "category",
      "urgency",
      "animalsImpacted",
      "deadline",
      "legacyStatus"
    )
    VALUES (
      fallback_campaign_id,
      'Legacy Campaign',
      'Placeholder campaign created to keep donation rows valid during migration.',
      0,
      0,
      fallback_partner_id,
      NULL,
      chosen_user_id,
      'DRAFT',
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP,
      'CAMPAIGN',
      NULL,
      NULL,
      NULL,
      NULL,
      'PENDING'
    )
    ON CONFLICT ("id") DO NOTHING;

    UPDATE "Donation"
    SET "campaignId" = fallback_campaign_id
    WHERE "campaignId" IS NULL;
  END IF;
END $$;

ALTER TABLE "User" ADD CONSTRAINT "User_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_phone_key" UNIQUE ("phone");
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_email_key" UNIQUE ("email");
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_razorpayAccountId_key" UNIQUE ("razorpayAccountId");
ALTER TABLE "AnimalReport" ADD CONSTRAINT "AnimalReport_assignedPartnerId_fkey" FOREIGN KEY ("assignedPartnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Campaign" ALTER COLUMN "partnerId" SET NOT NULL;
ALTER TABLE "MedicalRecord" ALTER COLUMN "partnerId" SET NOT NULL;
ALTER TABLE "Pet" ALTER COLUMN "partnerId" SET NOT NULL;
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Donation" DROP CONSTRAINT "Donation_campaignId_fkey";
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_razorpayPaymentLinkId_key" UNIQUE ("razorpayPaymentLinkId");
ALTER TABLE "Donation" ALTER COLUMN "partnerId" SET NOT NULL;
ALTER TABLE "Donation" ALTER COLUMN "grossAmount" SET NOT NULL;
ALTER TABLE "Donation" ALTER COLUMN "razorpayPaymentLinkId" SET NOT NULL;
ALTER TABLE "Donation" ALTER COLUMN "netAmount" SET NOT NULL;
ALTER TABLE "Donation" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_razorpaySubscriptionId_key" UNIQUE ("razorpaySubscriptionId");
ALTER TABLE "Subscription" ALTER COLUMN "partnerId" SET NOT NULL;
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Post" ALTER COLUMN "caption" SET NOT NULL;
ALTER TABLE "Post" ALTER COLUMN "postImage" SET NOT NULL;
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Comment" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "Comment" ALTER COLUMN "text" SET NOT NULL;

CREATE TABLE "Like" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Like_postId_userId_key" ON "Like" ("postId", "userId");

ALTER TABLE "Like" ADD CONSTRAINT "Like_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "PetDocument" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "fileData" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PetDocument_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PetDocument" ADD CONSTRAINT "PetDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "Partner_partnerType_idx" ON "Partner" ("partnerType");
CREATE INDEX "Partner_verificationStatus_idx" ON "Partner" ("verificationStatus");
CREATE INDEX "Partner_city_idx" ON "Partner" ("city");
CREATE INDEX "Campaign_partnerId_idx" ON "Campaign" ("partnerId");
CREATE INDEX "Campaign_status_idx" ON "Campaign" ("status");
CREATE INDEX "Campaign_deadline_idx" ON "Campaign" ("deadline");
CREATE INDEX "Campaign_category_idx" ON "Campaign" ("category");
CREATE INDEX "Campaign_requestType_idx" ON "Campaign" ("requestType");
CREATE INDEX "Campaign_urgency_idx" ON "Campaign" ("urgency");
CREATE INDEX "Donation_userId_idx" ON "Donation" ("userId");
CREATE INDEX "Donation_partnerId_idx" ON "Donation" ("partnerId");
CREATE INDEX "Donation_campaignId_idx" ON "Donation" ("campaignId");
CREATE INDEX "Donation_status_idx" ON "Donation" ("status");
