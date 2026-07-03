import { IQuery } from '@nestjs/cqrs';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FindAllSongsQuery implements IQuery {
  constructor(
    public readonly userId: string,
    public readonly paginationDto: PaginationDto,
  ) {}
}
