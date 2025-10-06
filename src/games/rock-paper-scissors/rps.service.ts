import { Injectable } from '@nestjs/common';
import { Game, RoomConfig, WaitingState } from './states/rps.states';

@Injectable()
export class GameService {
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
    this.games.delete(roomId);
    console.log(`Juego eliminado de sala: ${roomId}`);
  }

  getAllGames(): Game[] {
    return Array.from(this.games.values());
  }
}
