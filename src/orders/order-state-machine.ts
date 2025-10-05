import { OrderState } from './order-state.enum';

// A simple State Machine class that enforces allowed transitions
export class OrderStateMachine {
  // Current state of the order
  private state: OrderState;

  // Define valid transitions as a map
  private readonly transitions: Record<OrderState, OrderState[]> = {
    [OrderState.CREATED]: [OrderState.PAID], // created → paid
    [OrderState.PAID]: [OrderState.SHIPPED], // paid → shipped
    [OrderState.SHIPPED]: [OrderState.DELIVERED], // shipped → delivered
    [OrderState.DELIVERED]: [], // delivered → (end state)
  };

  // Constructor sets initial state
  constructor(initialState: OrderState = OrderState.CREATED) {
    this.state = initialState;
  }

  // Return current state
  getState(): OrderState {
    return this.state;
  }

  // Try to move to the next state
  transitionTo(nextState: OrderState): void {
    // Get allowed transitions from current state
    const allowed = this.transitions[this.state];

    // If requested state is not allowed, throw error
    if (!allowed.includes(nextState)) {
      throw new Error(`Invalid transition from ${this.state} to ${nextState}`);
    }

    // Otherwise, update the state
    this.state = nextState;
  }
}
