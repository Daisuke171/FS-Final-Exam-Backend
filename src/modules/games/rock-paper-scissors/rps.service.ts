import { Injectable } from '@nestjs/common';
import { Game, RoomConfig, WaitingState } from './states/rps.states';

@Injectable()
export class RpsService {
  private games: Map<string, Game> = new Map();

  createGame(roomId: string, roomConfig: RoomConfig): Game {
    const game = new Game(roomId, roomConfig, new WaitingState());
    this.games.set(roomId, game);
    console.log(`Juego creado en sala: ${roomId}`);
    return game;
  }

  getGame(roomId: string): Game | undefined {
    return this.games.get(roomId);
  }

  deleteGame(roomId: string): void {
    const game = this.games.get(roomId);
    if (game) {
      game.cleanup(); // Limpiar recursos antes de eliminar
      this.games.delete(roomId);
    }
  }

  getAllGames(): Game[] {
    return Array.from(this.games.values());
  }

  getPublicRooms(): Array<{
    id: string;
    name: string;
    currentPlayers: number;
    maxPlayers: number;
    state: string;
  }> {
    const publicRooms: Array<{
      id: string;
      name: string;
      currentPlayers: number;
      maxPlayers: number;
      state: string;
    }> = [];

    this.games.forEach((game, roomId) => {
      if (
        !game.roomConfig.isPrivate &&
        game.getCurrentState() === 'WaitingState' &&
        game.players.size > 0 &&
        game.players.size < 2
      ) {
        publicRooms.push({
          id: roomId,
          name: game.roomConfig.name,
          currentPlayers: game.players.size,
          maxPlayers: 2,
          state: game.getCurrentState(),
        });
      }
    });

    return publicRooms;
  }
}
