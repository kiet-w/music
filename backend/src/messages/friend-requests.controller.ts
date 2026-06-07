import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FriendRequestService } from './friend-request.service';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('friend-requests')
@Controller('friend-requests')
export class FriendRequestsController {
  constructor(private readonly friendRequestService: FriendRequestService) {}

  @Post('invite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new friend invitation link' })
  async createInvite(@Request() req, @Body() dto: CreateFriendRequestDto) {
    return this.friendRequestService.createInvite(req.user.id, dto);
  }

  @Get('info/:token')
  @ApiOperation({ summary: 'Get invitation info by token' })
  async getInviteInfo(@Param('token') token: string) {
    return this.friendRequestService.getInviteInfo(token);
  }

  @Post('accept/:token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a friend invitation' })
  async acceptInvite(@Request() req, @Param('token') token: string) {
    return this.friendRequestService.acceptInvite(token, req.user.id);
  }
}
