import { Injectable } from '@nestjs/common';
import { Prisma, FriendRequest } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';

@Injectable()
export class FriendRequestRepository extends BaseRepository<
  FriendRequest,
  Prisma.FriendRequestDelegate<any>
> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.friendRequest);
  }

  async findByToken(token: string): Promise<FriendRequest | null> {
    return this.findUnique({
      where: { token },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findPendingRequest(
    senderId: string,
    receiverId: string,
  ): Promise<FriendRequest | null> {
    return this.findFirst({
      where: {
        senderId,
        receiverId,
        status: 'PENDING',
      },
    });
  }
}
