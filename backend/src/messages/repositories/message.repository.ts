import { Injectable } from '@nestjs/common';
import { Prisma, Message } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';

@Injectable()
export class MessageRepository extends BaseRepository<
  Message,
  Prisma.MessageDelegate<any>
> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.message);
  }

  async findConversation(userId1: string, userId2: string): Promise<Message[]> {
    return this.findMany({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
