import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { FriendRequestsController } from './friend-requests.controller';
import { FriendRequestService } from './friend-request.service';
import { MessageRepository } from './repositories/message.repository';
import { FriendRequestRepository } from './repositories/friend-request.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [
    MessagesService,
    FriendRequestService,
    MessageRepository,
    FriendRequestRepository,
  ],
  controllers: [MessagesController, FriendRequestsController],
  exports: [MessagesService, FriendRequestService],
})
export class MessagesModule {}
