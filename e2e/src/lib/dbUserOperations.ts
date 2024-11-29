import { PrismaClient } from '@prisma/client';
import { appEnv } from './app-env';

export class DbUserOperations {
  prisma = new PrismaClient();
  userEmail = appEnv.IMAP_EMAIL;
  userEmailUpdated = `${appEnv.IMAP_EMAIL.split('@')[0]}+${crypto.randomUUID()}${appEnv.IMAP_EMAIL.split('@')[1]}`;
  updated = false;

  async checkExistingUserAndUpdate() {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: this.userEmail },
    });

    if (existingUser) {
      await this.prisma.user.update({
        where: { email: this.userEmail },
        data: {
          email: this.userEmailUpdated,
        },
      });
      this.updated = true;
    }
    return this.userEmailUpdated;
  }

  async revertDbOperations() {
    await this.prisma.user.update({
      where: { email: this.userEmail },
      data: {
        email: `${appEnv.IMAP_EMAIL.split('@')[0]}+${crypto.randomUUID()}${appEnv.IMAP_EMAIL.split('@')[1]}`,
      },
    });
    if (this.updated) {
      await this.prisma.user.update({
        where: { email: this.userEmailUpdated },
        data: {
          email: this.userEmail,
        },
      });
    }
  }

  async changeEmail(email: string) {
    await this.prisma.user.update({
      where: { email },
      data: {
        email: this.userEmail,
      },
    });
  }

  async revertEmail(email: string) {
    await this.prisma.user.update({
      where: { email: this.userEmail },
      data: {
        email: email,
      },
    });
    if (this.updated) {
      await this.prisma.user.update({
        where: { email: this.userEmailUpdated },
        data: {
          email: this.userEmail,
        },
      });
    }
  }
}
