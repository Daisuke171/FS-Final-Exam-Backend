-- AlterTable
ALTER TABLE "User" ALTER COLUMN "nickname" DROP NOT NULL,
ALTER COLUMN "avatar" DROP NOT NULL,
ALTER COLUMN "avatar" SET DEFAULT 'default.png';
