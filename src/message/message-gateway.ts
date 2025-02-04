import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from './message-service';
import { Prisma } from '@prisma/client';

@WebSocketGateway({ cors: true }) // Enable CORS
export class MessageGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly messageService: MessageService) {}

  // Handle user joining
  @SubscribeMessage('join')
  async handleJoin(@ConnectedSocket() client: Socket, @MessageBody() body: { userId: string}) {
    client.join(body.userId);
    console.log('User joined', body);
  }

  // Handle sending messages
  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() data: Prisma.MessageUncheckedCreateInput) {
    console.log('sendMessage', data);
    const message = await this.messageService.createMessage(data);
    this.server.to(data.receiverId).emit('receiveMessage', message);
    return message;
  }
}
