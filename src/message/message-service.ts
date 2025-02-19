import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Ensure Prisma is set up
import { ConnectedUserStatus, Prisma } from '@prisma/client';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  async createMessage(data: Prisma.MessageUncheckedCreateInput) {
    return this.prisma.message.create({
      data: data,
    });
  }

  async getMessages(senderId: string, receiverId: string) {
    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addConnection(userId: string, socketId: string) {
    return this.prisma.connectedUser.create({
      data: {
        userId,
        socketId,
        status: ConnectedUserStatus.ONLINE
      },
    });
  }

  async updateConnection(socketId: string) {
    return await this.prisma.connectedUser.updateMany({
      where: { socketId: socketId },
      data: { status: ConnectedUserStatus.OFFLINE },
    });
  }

  async getConnections(userId: string) {
    return this.prisma.connectedUser.findMany({
      where: { userId },
    });
  }
}
