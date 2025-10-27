import { Injectable } from '@nestjs/common';
import {
  Game,
  RoomConfig,
  WaitingState,
} from './states/turing-detective.states';
import { GamesService } from '../../games.service';
import { UserService } from '@modules/user/user.service';

@Injectable()
export class TDService {
  private games: Map<string, Game> = new Map();

  createGame(
    roomId: string,
    roomConfig: RoomConfig,
    gamesApiService: GamesService,
    usersService: UserService,
  ): Game {
    const game = new Game(
      roomId,
      roomConfig,
      new WaitingState(),
      gamesApiService,
      usersService,
    );
    this.games.set(roomId, game);
    console.log(`Turing Detective game created in room: ${roomId}`);
    return game;
  }

  getGame(roomId: string): Game | undefined {
    return this.games.get(roomId);
  }

  deleteGame(roomId: string): void {
    const game = this.games.get(roomId);
    if (game) {
      game.cleanup();
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
