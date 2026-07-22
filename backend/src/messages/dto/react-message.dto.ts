import { IsNotEmpty, IsString } from 'class-validator';

export class ReactMessageDto {
  @IsNotEmpty()
  @IsString()
  messageId: string;

  @IsNotEmpty()
  @IsString()
  emoji: string;
}
