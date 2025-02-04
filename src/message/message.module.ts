import { Module } from '@nestjs/common';
import { MessageGateway } from './message-gateway';
import { MessageService } from './message-service';
import { ChatController } from './message.controller';

@Module({
  imports: [],
  controllers: [ChatController],
  providers: [MessageGateway, MessageService],
})
export class MessageModule {}
