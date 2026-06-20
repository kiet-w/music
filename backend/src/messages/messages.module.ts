import { Module } from '@nestjs/common';
import { MessagesService } from './services/messages.service';
import { MessagesController } from './controllers/messages.controller';
import { FriendRequestsController } from './controllers/friend-requests.controller';
import { FriendRequestService } from './services/friend-request.service';
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
