import { Injectable } from '@nestjs/common';
import { OrderStateMachine } from './order-state-machine';
import { OrderState } from './order-state.enum';

@Injectable()
export class OrdersService {
  // In-memory storage of orders (id → state machine)
  private orders: Map<string, OrderStateMachine> = new Map();

  // Create a new order with default state (CREATED)
  createOrder(orderId: string): string {
    const machine = new OrderStateMachine(OrderState.CREATED);
    this.orders.set(orderId, machine);
    return `Order ${orderId} created with state: ${machine.getState()}`;
  }

  // Move order to the next state
  advanceOrder(orderId: string, nextState: OrderState): string {
    const machine = this.orders.get(orderId);
    if (!machine) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Perform transition
    machine.transitionTo(nextState);

    return `Order ${orderId} moved to state: ${machine.getState()}`;
  }

  // Get current state of an order
  getOrderState(orderId: string): OrderState {
    const machine = this.orders.get(orderId);
    if (!machine) {
      throw new Error(`Order ${orderId} not found`);
    }
    return machine.getState();
  }
}
