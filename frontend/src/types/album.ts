export interface Album {
  id: string;
  title: string;
  artist: string | null;
  coverUrl: string | null;
  createdAt: string;
  _count?: {
    songs: number;
  };
}

export type AlbumBasic = Pick<Album, 'id' | 'title'>;
