import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({ description: 'The content of the message' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'The ID of the user receiving the message' })
  @IsUUID()
  @IsNotEmpty()
  receiverId: string;
}
