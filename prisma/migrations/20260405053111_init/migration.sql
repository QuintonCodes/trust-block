-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('WORKER', 'CLIENT');

-- CreateEnum
CREATE TYPE "EscrowStatus" AS ENUM ('DRAFT', 'AWAITING_FUNDS', 'LOCKED', 'IN_REVIEW', 'RELEASED', 'CANCELLED', 'IN_DISPUTE');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING_FUNDS', 'FUNDED', 'WORK_SUBMITTED', 'PENDING_APPROVAL', 'APPROVED_AND_PAID', 'AUTO_RELEASED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'PAYOUT', 'FEE_COLLECTION', 'REFUND');

-- CreateTable
CREATE TABLE "users" (
    "wallet_address" TEXT NOT NULL,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "bio" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'WORKER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("wallet_address")
);

-- CreateTable
CREATE TABLE "escrow_links" (
    "id" TEXT NOT NULL,
    "freelancer_address" TEXT NOT NULL,
    "client_address" TEXT,
    "project_title" TEXT NOT NULL,
    "scope_of_work" TEXT NOT NULL,
    "total_amount" DECIMAL(18,6) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USDC',
    "status" "EscrowStatus" NOT NULL DEFAULT 'DRAFT',
    "contract_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escrow_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "escrow_link_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(18,6) NOT NULL,
    "order_index" INTEGER NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING_FUNDS',
    "due_date" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3),
    "auto_release_at" TIMESTAMP(3),

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "escrow_link_id" TEXT NOT NULL,
    "tx_hash" TEXT NOT NULL,
    "transaction_type" "TransactionType" NOT NULL,
    "from_address" TEXT NOT NULL,
    "to_address" TEXT NOT NULL,
    "amount" DECIMAL(18,6) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_tx_hash_key" ON "transactions"("tx_hash");

-- AddForeignKey
ALTER TABLE "escrow_links" ADD CONSTRAINT "escrow_links_freelancer_address_fkey" FOREIGN KEY ("freelancer_address") REFERENCES "users"("wallet_address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escrow_links" ADD CONSTRAINT "escrow_links_client_address_fkey" FOREIGN KEY ("client_address") REFERENCES "users"("wallet_address") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_escrow_link_id_fkey" FOREIGN KEY ("escrow_link_id") REFERENCES "escrow_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_escrow_link_id_fkey" FOREIGN KEY ("escrow_link_id") REFERENCES "escrow_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;
