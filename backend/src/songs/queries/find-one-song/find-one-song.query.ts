import { IQuery } from '@nestjs/cqrs';

export class FindOneSongQuery implements IQuery {
  constructor(
    public readonly userId: string,
    public readonly id: string,
  ) {}
}
