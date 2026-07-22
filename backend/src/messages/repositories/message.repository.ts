import { Injectable } from '@nestjs/common';
import { Prisma, Message, FriendRequest, RequestStatus } from '@prisma/client';
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

  async findConversation(
    userId1: string,
    userId2: string,
    before?: string,
    limit: number = 30,
  ): Promise<Message[]> {
    const where: Prisma.MessageWhereInput = {
      OR: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
    };

    if (before) {
      const beforeDate = new Date(before);
      if (!isNaN(beforeDate.getTime())) {
        where.createdAt = { lt: beforeDate };
      }
    }

    const messages = await this.prisma.message.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return messages.reverse();
  }

  async checkConnection(userId1: string, userId2: string): Promise<boolean> {
    const connection = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          {
            senderId: userId1,
            receiverId: userId2,
            status: RequestStatus.ACCEPTED,
          },
          {
            senderId: userId2,
            receiverId: userId1,
            status: RequestStatus.ACCEPTED,
          },
        ],
      },
    });

    return !!connection;
  }

  async findAcceptedFriends(userId: string) {
    return this.prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: userId, status: RequestStatus.ACCEPTED },
          { receiverId: userId, status: RequestStatus.ACCEPTED },
        ],
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
        receiver: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async createFriendRequest(
    data: Prisma.FriendRequestCreateInput,
  ): Promise<FriendRequest> {
    return this.prisma.friendRequest.create({ data });
  }

  async findFriendRequestByToken(token: string) {
    return this.prisma.friendRequest.findUnique({
      where: { token },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async updateFriendRequest(
    where: Prisma.FriendRequestWhereUniqueInput,
    data: Prisma.FriendRequestUpdateInput,
  ): Promise<FriendRequest> {
    return this.prisma.friendRequest.update({ where, data });
  }
}
