import { Controller, Get, Param } from '@nestjs/common';
import { MessageService } from './message-service';

@Controller('chat')
export class ChatController {
  constructor(private readonly messageService: MessageService) {}

  @Get(':user1/:user2')
  async getChatHistory(@Param('user1') user1: string, @Param('user2') user2: string) {
    return this.messageService.getMessages(user1, user2);
  }
}
