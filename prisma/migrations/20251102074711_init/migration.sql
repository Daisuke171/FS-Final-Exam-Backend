-- CreateEnum
CREATE TYPE "MissionType" AS ENUM ('GENERAL', 'DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "MissionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateTable
CREATE TABLE "missions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "MissionType" NOT NULL DEFAULT 'GENERAL',
    "difficulty" "MissionDifficulty" NOT NULL DEFAULT 'EASY',
    "icon" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "gameId" TEXT,
    "xpReward" INTEGER NOT NULL DEFAULT 0,
    "coinsReward" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_mission_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mission_id" TEXT NOT NULL,
    "currentProgress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "claimedReward" BOOLEAN NOT NULL DEFAULT false,
    "reset_at" TIMESTAMP(3),
    "last_reset_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "claimed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_mission_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "missions_title_key" ON "missions"("title");

-- CreateIndex
CREATE INDEX "user_mission_progress_user_id_idx" ON "user_mission_progress"("user_id");

-- CreateIndex
CREATE INDEX "user_mission_progress_mission_id_idx" ON "user_mission_progress"("mission_id");

-- CreateIndex
CREATE INDEX "user_mission_progress_completed_idx" ON "user_mission_progress"("completed");

-- CreateIndex
CREATE UNIQUE INDEX "user_mission_progress_user_id_mission_id_key" ON "user_mission_progress"("user_id", "mission_id");

-- AddForeignKey
ALTER TABLE "user_mission_progress" ADD CONSTRAINT "user_mission_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_mission_progress" ADD CONSTRAINT "user_mission_progress_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
