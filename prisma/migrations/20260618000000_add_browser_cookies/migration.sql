-- CreateTable
CREATE TABLE "browser_cookies" (
    "id" SERIAL NOT NULL,
    "domain" TEXT NOT NULL,
    "cookies" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "browser_cookies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "browser_cookies_domain_key" ON "browser_cookies"("domain");
