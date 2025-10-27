/*
  Warnings:

  - A unique constraint covering the columns `[user_id,game_id]` on the table `game_favorites` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "game_favorites_user_id_game_id_key" ON "game_favorites"("user_id", "game_id");
