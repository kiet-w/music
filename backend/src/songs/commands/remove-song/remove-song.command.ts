import { ICommand } from '@nestjs/cqrs';

export class RemoveSongCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly id: string,
  ) {}
}
