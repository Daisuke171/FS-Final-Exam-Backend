import { Controller, Post, Param, Body, Get } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderState } from './order-state.enum';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  healthCheck() {
    return 'OK';
  }

  // Create a new order
  @Post(':id')
  create(@Param('id') id: string) {
    return this.ordersService.createOrder(id);
  }

  // Advance order to next state
  @Post(':id/advance')
  advance(
    @Param('id') id: string,
    @Body('state') state: OrderState, // The state you want to move to
  ) {
    return this.ordersService.advanceOrder(id, state);
  }

  // Get current state of the order
  @Get(':id')
  getState(@Param('id') id: string) {
    return this.ordersService.getOrderState(id);
  }
}
