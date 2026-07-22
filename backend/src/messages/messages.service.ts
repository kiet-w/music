import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { MessageRepository } from './repositories/message.repository';
import { MessagesGateway } from './messages.gateway';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';
import { Message, FriendRequest, RequestStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MessagesService {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  async create(
    senderId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    const isConnected = await this.messageRepository.checkConnection(
      senderId,
      createMessageDto.receiverId,
    );

    if (!isConnected) {
      throw new ForbiddenException(
        'Hai người chưa là bạn bè. Không thể gửi tin nhắn.',
      );
    }

    const newMessage = await this.messageRepository.create({
      data: {
        content: createMessageDto.content,
        sender: { connect: { id: senderId } },
        receiver: { connect: { id: createMessageDto.receiverId } },
      },
    });

    // Emit real-time WebSocket event to the receiver
    this.messagesGateway.emitNewMessage(createMessageDto.receiverId, newMessage);

    return newMessage;
  }

  async findAllByConversation(
    userId1: string,
    userId2: string,
    before?: string,
    limit: number = 30,
  ): Promise<any[]> {
    return this.messageRepository.findConversation(userId1, userId2, before, limit);
  }

  async reactToMessage(userId: string, messageId: string, emoji: string): Promise<any> {
    const message = await this.messageRepository.findMessageById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId && message.receiverId !== userId) {
      throw new ForbiddenException('You are not part of this conversation');
    }

    const updatedMessage = await this.messageRepository.toggleReaction(
      userId,
      messageId,
      emoji,
    );

    // Broadcast reaction update via Socket.io
    this.messagesGateway.emitMessageReactionUpdated(
      updatedMessage.senderId,
      updatedMessage.receiverId,
      updatedMessage,
    );

    return updatedMessage;
  }

  async createInvite(
    senderId: string,
    dto: CreateFriendRequestDto,
  ): Promise<FriendRequest> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return this.messageRepository.createFriendRequest({
      token: uuidv4(),
      sender: { connect: { id: senderId } },
      ...(dto.receiverId
        ? { receiver: { connect: { id: dto.receiverId } } }
        : {}),
      expiresAt,
    });
  }

  async getInviteInfo(token: string): Promise<any> {
    const invite = await this.messageRepository.findFriendRequestByToken(token);

    if (!invite) {
      throw new NotFoundException('Invite link not found');
    }

    if (invite.status !== RequestStatus.PENDING) {
      throw new BadRequestException(
        `Invite link is already ${invite.status.toLowerCase()}`,
      );
    }

    if (new Date() > invite.expiresAt) {
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

    if (invite.receiverId && invite.receiverId !== receiverId) {
      throw new BadRequestException('This invite is intended for another user');
    }

    const isAlreadyConnected = await this.messageRepository.checkConnection(
      invite.senderId,
      receiverId,
    );
    if (isAlreadyConnected) {
      throw new BadRequestException('You are already connected with this user');
    }

    const result = await this.messageRepository.acceptFriendRequestAtomically(
      invite.id,
      receiverId,
    );

    if (!result) {
      throw new ConflictException(
        'Invite link was already accepted or has expired',
      );
    }

    // Emit real-time WebSocket event to both Sender & Receiver to update friend list instantly
    this.messagesGateway.emitFriendRequestAccepted(
      invite.senderId,
      receiverId,
      result,
    );

    return result;
  }

  async getFriends(userId: string): Promise<any[]> {
    const connections = await this.messageRepository.findAcceptedFriends(userId);

    return connections.map((conn) => {
      const friend = conn.senderId === userId ? conn.receiver : conn.sender;
      const presence = this.messagesGateway.getUserPresence(friend.id);
      return {
        id: friend.id,
        name: friend.name,
        email: friend.email,
        isOnline: presence.isOnline,
        lastSeen: presence.lastSeen,
      };
    });
  }
}
