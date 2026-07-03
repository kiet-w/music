import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleUnifiedLoginDto {
  @ApiProperty({ description: 'Google Authorization Code' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Google Redirect URI used in client request',
    required: false,
  })
  @IsOptional()
  @IsString()
  redirectUri?: string;
}
