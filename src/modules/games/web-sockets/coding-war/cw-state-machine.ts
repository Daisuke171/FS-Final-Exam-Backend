import { GameState } from './cw-state.enum';

export class CWStateMachine {
  private state: GameState;

  private readonly transitions: Record<GameState, GameState[]> = {
    [GameState.inLobby]: [GameState.startingMatch],
    [GameState.startingMatch]: [GameState.matchStarted],
    [GameState.matchStarted]: [GameState.matchFinished],
    [GameState.matchFinished]: [GameState.gameOver],
    [GameState.gameOver]: [],
  };

  constructor() {
    this.state = GameState.inLobby;
  }

  getState(): GameState {
    return this.state;
  }

  trasitionTo(nextState: GameState): void {
    const allowed = this.transitions[this.state];

    if (!allowed.includes(nextState)) {
      throw new Error(`Invalid transition from ${this.state} to ${nextState}`);
    }

    this.state = nextState;
  }

  isInLobby(): boolean {
    return this.state === GameState.inLobby;
  }

  isStartingMatch(): boolean {
    return this.state === GameState.startingMatch;
  }

  isMatchStarted(): boolean {
    return this.state === GameState.matchStarted;
  }

  isMatchFinished(): boolean {
    return this.state === GameState.matchFinished;
  }

  isGameOver(): boolean {
    return this.state === GameState.gameOver;
  }
}
