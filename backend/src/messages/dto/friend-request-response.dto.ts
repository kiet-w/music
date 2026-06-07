import { ApiProperty } from '@nestjs/swagger';
import { RequestStatus } from '@prisma/client';

export class FriendRequestResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  token: string;

  @ApiProperty()
  senderId: string;

  @ApiProperty({ required: false })
  receiverId?: string | null;

  @ApiProperty({ enum: RequestStatus })
  status: RequestStatus;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  createdAt: Date;
}
