import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFriendRequestDto {
  @ApiProperty({
    description: 'Optional ID of the user to invite',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  receiverId?: string;
}
