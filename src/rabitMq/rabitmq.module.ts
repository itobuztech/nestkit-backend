import { Module } from '@nestjs/common';
import { RabitMqController } from './rabitmq.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import appEnv from 'src/env';

@Module({
  imports: [
    // RabbitMQ Producer
    ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [appEnv.RABBIT_MQ_URL],
          queue: 'notification_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  controllers: [RabitMqController],
  providers: [],
})
export class RabitMqModule {}
