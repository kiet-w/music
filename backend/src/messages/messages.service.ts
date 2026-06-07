import { Injectable } from '@nestjs/common';
import { MessageRepository } from './repositories/message.repository';
import { CreateMessageDto } from './dto/create-message.dto';
import { Message } from '@prisma/client';

@Injectable()
export class MessagesService {
  constructor(private readonly messageRepository: MessageRepository) {}

  async create(
    senderId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    return this.messageRepository.create({
      data: {
        content: createMessageDto.content,
        sender: { connect: { id: senderId } },
        receiver: { connect: { id: createMessageDto.receiverId } },
      },
    });
  }

  async findAllByConversation(
    userId1: string,
    userId2: string,
  ): Promise<Message[]> {
    return this.messageRepository.findConversation(userId1, userId2);
  }
}
