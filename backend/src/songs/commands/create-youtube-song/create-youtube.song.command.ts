import { ICommand } from '@nestjs/cqrs';
export class CreateSongFromYoutubeCommand implements ICommand {
  constructor(
    public readonly userId: string,
    public readonly url: string,
    public readonly title: string,
    public readonly artist?: string,
    public readonly albumId?: string,
    
  ) {}
}
