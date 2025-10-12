/*
  Warnings:

  - You are about to drop the column `user_id` on the `friends` table. All the data in the column will be lost.
  - The `status` column on the `friends` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[requesterId,receiverId]` on the table `friends` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `receiverId` to the `friends` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requesterId` to the `friends` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FriendStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'BLOCKED');

-- DropForeignKey
ALTER TABLE "public"."friends" DROP CONSTRAINT "friends_user_id_fkey";

-- AlterTable
ALTER TABLE "friends" DROP COLUMN "user_id",
ADD COLUMN     "receiverId" TEXT NOT NULL,
ADD COLUMN     "requesterId" TEXT NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "FriendStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "friend_invites" (
    "id" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "targetUserId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedById" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "friend_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "friend_invites_tokenHash_key" ON "friend_invites"("tokenHash");

-- CreateIndex
CREATE INDEX "friend_invites_inviterId_idx" ON "friend_invites"("inviterId");

-- CreateIndex
CREATE INDEX "friend_invites_targetUserId_idx" ON "friend_invites"("targetUserId");

-- CreateIndex
CREATE INDEX "friend_invites_expiresAt_idx" ON "friend_invites"("expiresAt");

-- CreateIndex
CREATE INDEX "friends_requesterId_idx" ON "friends"("requesterId");

-- CreateIndex
CREATE INDEX "friends_receiverId_idx" ON "friends"("receiverId");

-- CreateIndex
CREATE INDEX "friends_status_idx" ON "friends"("status");

-- CreateIndex
CREATE UNIQUE INDEX "friends_requesterId_receiverId_key" ON "friends"("requesterId", "receiverId");

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_invites" ADD CONSTRAINT "friend_invites_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_invites" ADD CONSTRAINT "friend_invites_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_invites" ADD CONSTRAINT "friend_invites_usedById_fkey" FOREIGN KEY ("usedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
