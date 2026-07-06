import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, IsIn, IsString } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @IsIn([10, 20, 30, 50, 100])
  limit: number = 10;
  @IsOptional()
  @IsString()
  @IsIn(['title', 'artist', 'createdAt'])
  sort?: string;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }

  get take(): number {
    return this.limit;
  }
}
