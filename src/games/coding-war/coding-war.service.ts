import { Injectable } from '@nestjs/common';
import { CWStateMachine } from './cw-state-machine';
import { GameState } from './cw-state.enum';

@Injectable()
export class CodingWarService {
  private gameState: Map<string, CWStateMachine> = new Map();

  createGame(gameId: string): GameState {
    const machine = new CWStateMachine();
    this.gameState.set(gameId, machine);
    return machine.getState();
  }

  advanceGame(gameId: string, nextState: GameState): string {
    const machine = this.gameState.get(gameId);
    if (!machine) {
      throw new Error(`Game ${gameId} not found`);
    }

    machine.trasitionTo(nextState);

    return `Game ${gameId} moved to state: ${machine.getState()}`;
  }

  getGameState(gameId: string): GameState {
    const machine = this.gameState.get(gameId);
    if (!machine) {
      throw new Error(`Game ${gameId} not found`);
    }
    return machine.getState();
  }

  terminateGame(gameId: string): string {
    const machine = this.gameState.get(gameId);
    if (!machine) {
      throw new Error(`Game ${gameId} not found`);
    } else if (machine.getState() !== GameState.gameOver) {
      throw new Error(`Game ${gameId} is not in gameOver state`);
    }
    this.gameState.delete(gameId);
    return `Game ${gameId} terminated`;
  }
}
