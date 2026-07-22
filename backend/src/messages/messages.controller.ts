import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessageResponseDto } from './dto/message-response.dto';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { Public } from '../auth/decorators/public.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

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
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Gửi tin nhắn thành công')
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createMessageDto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    const message = await this.messagesService.create(
      user.id,
      createMessageDto,
    );
    return plainToInstance(MessageResponseDto, message);
  }

  @ApiOperation({ summary: 'React to a message with an emoji' })
  @Post('react')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Cập nhật cảm xúc tin nhắn thành công')
  async reactToMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: { messageId: string; emoji: string },
  ) {
    return this.messagesService.reactToMessage(user.id, dto.messageId, dto.emoji);
  }

  @ApiOperation({ summary: 'Get list of friends' })
  @Get('friends')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Lấy danh sách bạn bè thành công')
  async getFriends(@CurrentUser() user: AuthenticatedUser) {
    return this.messagesService.getFriends(user.id);
  }

  @ApiOperation({ summary: 'Create a new friend invitation link' })
  @Post('invite')
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Tạo lời mời kết bạn thành công')
  async createInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFriendRequestDto,
  ) {
    return this.messagesService.createInvite(user.id, dto);
  }

  @ApiOperation({ summary: 'Get invitation info by token' })
  @Get('invite/info/:token')
  @HttpCode(HttpStatus.OK)
  @Public()
  @ResponseMessage('Lấy thông tin lời mời kết bạn thành công')
  async getInviteInfo(@Param('token') token: string) {
    return this.messagesService.getInviteInfo(token);
  }

  @ApiOperation({ summary: 'Accept a friend invitation' })
  @Post('invite/accept/:token')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Chấp nhận lời mời kết bạn thành công')
  async acceptInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('token') token: string,
  ) {
    return this.messagesService.acceptInvite(token, user.id);
  }

  @ApiOperation({ summary: 'Get chat history with another user' })
  @ApiResponse({
    status: 200,
    description: 'Return chat history.',
    type: [MessageResponseDto],
  })
  @Get(':userId')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Lấy lịch sử tin nhắn thành công')
  async findAllByConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('userId') otherUserId: string,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ): Promise<MessageResponseDto[]> {
    const limitNum = Math.min(Math.max(1, parseInt(limit || '30', 10) || 30), 100);
    const messages = await this.messagesService.findAllByConversation(
      user.id,
      otherUserId,
      before,
      limitNum,
    );
    return plainToInstance(MessageResponseDto, messages);
  }
}
