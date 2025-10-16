import { Controller, Post, Param, Get, Body } from '@nestjs/common';
import { CodingWarService } from './coding-war.service';
import { GameState } from './cw-state.enum';

@Controller('coding-war')
export class CodingWarController {
  constructor(private readonly gamesService: CodingWarService) {}

  @Get()
  healthCheck() {
    return 'OK';
  }

  // Create a new game
  @Post(':id')
  create(@Param('id') id: string) {
    return this.gamesService.createGame(id);
  }

  // Get current state of the game
  @Get(':id')
  getState(@Param('id') id: string) {
    return this.gamesService.getGameState(id);
  }

  // Advance game to next state
  @Post(':id/advance')
  advance(@Param('id') id: string, @Body('state') state: GameState) {
    return this.gamesService.advanceGame(id, state);
  }

  // Terminate game
  @Post(':id/terminate')
  terminate(@Param('id') id: string) {
    return this.gamesService.terminateGame(id);
  }
}
