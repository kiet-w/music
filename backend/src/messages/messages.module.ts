import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessageRepository } from './repositories/message.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [MessagesService, MessageRepository],
  controllers: [MessagesController]
})
export class MessagesModule {}
