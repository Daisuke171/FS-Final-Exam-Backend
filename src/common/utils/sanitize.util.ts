import { User, Level } from '@prisma/client';

export function sanitizeAuthResponse(user: User & { level: Level }) {
  const { password, ...safeUser } = user;
  return {
    ...safeUser,
    skins: [],
    friends: [],
    gameHistory: [],
    gameFavorites: [],
    notifications: [],
    chats: [],
  };
}
