-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('ACTIVE', 'UPCOMING', 'DISABLED');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('MISSION', 'ALERT');

-- AlterTable
ALTER TABLE "games" ADD COLUMN     "status" "GameStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "challengeType" "ChallengeStatus" NOT NULL DEFAULT 'ALERT',
ADD COLUMN     "is_read" BOOLEAN NOT NULL DEFAULT false;
