import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FriendRequestRepository } from '../repositories/friend-request.repository';
import { CreateFriendRequestDto } from '../dto/create-friend-request.dto';
import { FriendRequest, RequestStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FriendRequestService {
  constructor(
    private readonly friendRequestRepository: FriendRequestRepository,
  ) {}

  async createInvite(
    senderId: string,
    dto: CreateFriendRequestDto,
  ): Promise<FriendRequest> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return this.friendRequestRepository.create({
      data: {
        token: uuidv4(),
        senderId,
        receiverId: dto.receiverId,
        expiresAt,
      },
    });
  }

  async getInviteInfo(token: string): Promise<any> {
    const invite = await this.friendRequestRepository.findByToken(token);

    if (!invite) {
      throw new NotFoundException('Invite link not found');
    }

    if (invite.status !== RequestStatus.PENDING) {
      throw new BadRequestException(
        `Invite link is already ${invite.status.toLowerCase()}`,
      );
    }

    if (new Date() > invite.expiresAt) {
      // Update status to EXPIRED if it hasn't been updated yet
      await this.friendRequestRepository.update({
        where: { id: invite.id },
        data: { status: RequestStatus.EXPIRED },
      });
      throw new BadRequestException('Invite link has expired');
    }

    return invite;
  }

  async acceptInvite(
    token: string,
    receiverId: string,
  ): Promise<FriendRequest> {
    const invite = await this.getInviteInfo(token);

    if (invite.senderId === receiverId) {
      throw new BadRequestException('You cannot accept your own invite');
    }

    return this.friendRequestRepository.update({
      where: { id: invite.id },
      data: {
        status: RequestStatus.ACCEPTED,
        receiverId,
      },
    });
  }

  async checkConnection(userId1: string, userId2: string): Promise<boolean> {
    const connection = await this.friendRequestRepository.findFirst({
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
}
