/*
  Warnings:

  - A unique constraint covering the columns `[friend_id]` on the table `chats` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('RINGING', 'ACCEPTED', 'REJECTED', 'ENDED');

-- CreateTable
CREATE TABLE "calls" (
    "id" TEXT NOT NULL,
    "caller_id" TEXT NOT NULL,
    "callee_id" TEXT NOT NULL,
    "status" "CallStatus" NOT NULL DEFAULT 'RINGING',
    "sdp_offer" TEXT,
    "sdp_answer" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calls_caller_id_idx" ON "calls"("caller_id");

-- CreateIndex
CREATE INDEX "calls_callee_id_idx" ON "calls"("callee_id");

-- CreateIndex
CREATE INDEX "calls_status_idx" ON "calls"("status");

-- CreateIndex
CREATE UNIQUE INDEX "chats_friend_id_key" ON "chats"("friend_id");

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_caller_id_fkey" FOREIGN KEY ("caller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_callee_id_fkey" FOREIGN KEY ("callee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
