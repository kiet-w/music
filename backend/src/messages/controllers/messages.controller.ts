import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from '../services/messages.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { MessageResponseDto } from '../dto/message-response.dto';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('messages')
@UseInterceptors(ClassSerializerInterceptor)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @ApiOperation({ summary: 'Send a new message' })
  @ApiResponse({
    status: 201,
    description: 'The message has been successfully sent.',
    type: MessageResponseDto,
  })
  @Post()
  async create(
    @CurrentUser() user: any,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    const message = await this.messagesService.create(user.id, createMessageDto);
    return plainToInstance(MessageResponseDto, message);
  }

  @ApiOperation({ summary: 'Get chat history with another user' })
  @ApiResponse({
    status: 200,
    description: 'Return chat history.',
    type: [MessageResponseDto],
  })
  @Get(':userId')
  async findAllByConversation(
    @CurrentUser() user: any,
    @Param('userId') otherUserId: string,
  ): Promise<MessageResponseDto[]> {
    const messages = await this.messagesService.findAllByConversation(user.id, otherUserId);
    return plainToInstance(MessageResponseDto, messages);
  }
}
