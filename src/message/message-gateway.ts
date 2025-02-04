import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from './message-service';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: true }) // Enable CORS
export class MessageGateway {
  @WebSocketServer()
  server: Server;


  constructor(
    private readonly jwtService: JwtService,
    private readonly messageService: MessageService
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake headers or auth object
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        console.log('Client connection rejected: No token');
        client.emit('disconnect_reason', { message: 'Authentication token missing' });
        client.disconnect(); // Disconnect the client immediately
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      client.data.user = payload; // Store user in socket
      await this.messageService.addConnection(payload.userId, client.id);
      console.log(`Client connected: ${payload.userId}`);
    } catch (error) {
      client.emit('disconnect_reason', { message: error.message });
      console.log('Client connection rejected: Invalid token');
      client.disconnect(); // Disconnect the client immediately
    }
  }

  async handleDisconnect(client: Socket) {
    await this.messageService.removeConnection(client.id);
    console.log(`Client disconnected: ${client.id}`);
  }


  // Handle user joining
  @SubscribeMessage('join')
  async handleJoin(
    @MessageBody() body: { userId: string},
    @ConnectedSocket() client: Socket
  ) {
    console.log('User joined', body);
    client.join(body.userId);
  }

  // Handle sending messages
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: Prisma.MessageUncheckedCreateInput,
    @ConnectedSocket() client: Socket
  ) {
    const senderId = client.data.user.userId;
    const payload: Prisma.MessageUncheckedCreateInput  = {
      senderId: senderId,
      receiverId: data.receiverId,
      content: data.content,
    };
    // console.log('sendMessage', data, payload);

    const message = await this.messageService.createMessage(payload);
    this.server.to(payload.receiverId).emit('receiveMessage', message);
    return message;
  }
}
