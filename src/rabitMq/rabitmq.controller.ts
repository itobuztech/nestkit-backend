
import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy, EventPattern } from '@nestjs/microservices';

@Controller()
export class RabitMqController {
constructor(
    @Inject('NOTIFICATION_SERVICE')
    private readonly rabbit_mq_client: ClientProxy,
  ) {}

  @Post('notification-create')
  async createNotification(@Body() payload: any) {
    this.rabbit_mq_client.emit('order_created', payload);
    return payload;
  }

  // Event subscriber
  @EventPattern('order_created')
  async handleOrderCreated(data: Record<string, unknown>) {
    console.log('Order created', data);
    // Send mail to users
  }
}
