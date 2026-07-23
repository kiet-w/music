export interface AlbumItem {
  id: string;
  title: string;
  artist?: string | null;
  coverUrl?: string | null;
  _count?: { songs: number };
}

export interface ChartItem {
  id: string;
  rank: number;
  title: string;
  artist: string;
  cover: string;
  url: string;
  trend: 'up' | 'down' | 'same';
  change: number;
  duration: string;
  genre: string;
}

export interface PlayTrackItem {
  id: string;
  title: string;
  artist?: string | null;
  cover?: string;
  coverUrl?: string;
  url?: string;
}

export const MOCK_CHARTS: Record<'vn' | 'global' | 'usuk', ChartItem[]> = {
  vn: [
    { id: 'vn-1', rank: 1, title: 'Đừng Làm Nó Phức Tạp', artist: 'MCK ft. JustaTee', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80', url: '', trend: 'up', change: 2, duration: '3:45', genre: 'Rap Việt' },
    { id: 'vn-2', rank: 2, title: 'Nếu Lúc Đó', artist: 'tlinh ft. 24k.Right', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80', url: '', trend: 'same', change: 0, duration: '4:12', genre: 'V-Pop' },
    { id: 'vn-3', rank: 3, title: 'Nơi Này Có Anh (Lofi Remix)', artist: 'Sơn Tùng M-TP', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80', url: '', trend: 'up', change: 1, duration: '3:20', genre: 'Lo-fi' },
    { id: 'vn-4', rank: 4, title: 'Chưa Quên Người Yêu Cũ', artist: 'Hà Nhi', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=80', url: '', trend: 'down', change: 1, duration: '4:05', genre: 'V-Pop' },
    { id: 'vn-5', rank: 5, title: 'Cắt Đôi Nỗi Sầu', artist: 'Tăng Duy Tân', cover: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&auto=format&fit=crop&q=80', url: '', trend: 'up', change: 3, duration: '3:10', genre: 'EDM' },
    { id: 'vn-6', rank: 6, title: 'Từng Quen', artist: 'Wren Evans', cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&auto=format&fit=crop&q=80', url: '', trend: 'same', change: 0, duration: '2:55', genre: 'V-Pop' },
    { id: 'vn-7', rank: 7, title: 'Bật Tình Yêu Lên', artist: 'Hòa Minzy x Tăng Duy Tân', cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&auto=format&fit=crop&q=80', url: '', trend: 'down', change: 2, duration: '3:30', genre: 'V-Pop' },
    { id: 'vn-8', rank: 8, title: 'Chủ Nhật Buồn', artist: 'Vũ.', cover: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=300&auto=format&fit=crop&q=80', url: '', trend: 'up', change: 1, duration: '4:18', genre: 'Acoustic' },
    { id: 'vn-9', rank: 9, title: 'Lạc Trôi (Ambient Chill)', artist: 'Triple D x Sơn Tùng', cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=80', url: '', trend: 'same', change: 0, duration: '3:50', genre: 'Chill' },
    { id: 'vn-10', rank: 10, title: 'À Lôi', artist: 'Double2T ft. Masew', cover: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&auto=format&fit=crop&q=80', url: '', trend: 'down', change: 3, duration: '3:05', genre: 'Rap Việt' },
  ],
  global: [
    { id: 'gl-1', rank: 1, title: 'Die With A Smile', artist: 'Lady Gaga & Bruno Mars', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80', url: '', trend: 'up', change: 1, duration: '4:11', genre: 'Pop' },
    { id: 'gl-2', rank: 2, title: 'Espresso', artist: 'Sabrina Carpenter', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80', url: '', trend: 'same', change: 0, duration: '2:55', genre: 'Pop' },
    { id: 'gl-3', rank: 3, title: 'Birds of a Feather', artist: 'Billie Eilish', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=80', url: '', trend: 'up', change: 2, duration: '3:30', genre: 'Indie' },
    { id: 'gl-4', rank: 4, title: 'Good Luck, Babe!', artist: 'Chappell Roan', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80', url: '', trend: 'down', change: 1, duration: '3:38', genre: 'Pop' },
    { id: 'gl-5', rank: 5, title: 'Starboy (Synthwave Edit)', artist: 'The Weeknd', cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=80', url: '', trend: 'up', change: 4, duration: '3:50', genre: 'R&B' },
    { id: 'gl-6', rank: 6, title: 'Cruel Summer', artist: 'Taylor Swift', cover: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=300&auto=format&fit=crop&q=80', url: '', trend: 'same', change: 0, duration: '2:58', genre: 'Pop' },
    { id: 'gl-7', rank: 7, title: 'Greedy', artist: 'Tate McRae', cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&auto=format&fit=crop&q=80', url: '', trend: 'down', change: 2, duration: '2:11', genre: 'Pop' },
    { id: 'gl-8', rank: 8, title: 'Flowers', artist: 'Miley Cyrus', cover: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&auto=format&fit=crop&q=80', url: '', trend: 'same', change: 0, duration: '3:20', genre: 'Pop' },
    { id: 'gl-9', rank: 9, title: 'As It Was', artist: 'Harry Styles', cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&auto=format&fit=crop&q=80', url: '', trend: 'up', change: 1, duration: '2:47', genre: 'Indie' },
    { id: 'gl-10', rank: 10, title: 'Blinding Lights', artist: 'The Weeknd', cover: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&auto=format&fit=crop&q=80', url: '', trend: 'down', change: 1, duration: '3:22', genre: 'R&B' },
  ],
  usuk: [
    { id: 'us-1', rank: 1, title: 'Not Like Us', artist: 'Kendrick Lamar', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80', url: '', trend: 'same', change: 0, duration: '4:34', genre: 'Rap Việt' },
    { id: 'us-2', rank: 2, title: 'A Bar Song (Tipsy)', artist: 'Shaboozey', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80', url: '', trend: 'up', change: 2, duration: '2:51', genre: 'Acoustic' },
    { id: 'us-3', rank: 3, title: 'I Had Some Help', artist: 'Post Malone ft. Morgan Wallen', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=80', url: '', trend: 'down', change: 1, duration: '2:58', genre: 'Acoustic' },
    { id: 'us-4', rank: 4, title: 'Please Please Please', artist: 'Sabrina Carpenter', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80', url: '', trend: 'up', change: 1, duration: '3:06', genre: 'Pop' },
    { id: 'us-5', rank: 5, title: 'Too Sweet', artist: 'Hozier', cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=80', url: '', trend: 'same', change: 0, duration: '4:11', genre: 'Indie' },
    { id: 'us-6', rank: 6, title: 'Fortnight', artist: 'Taylor Swift ft. Post Malone', cover: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&auto=format&fit=crop&q=80', url: '', trend: 'down', change: 2, duration: '3:48', genre: 'Pop' },
    { id: 'us-7', rank: 7, title: 'Lose Control', artist: 'Teddy Swims', cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&auto=format&fit=crop&q=80', url: '', trend: 'up', change: 3, duration: '3:30', genre: 'R&B' },
    { id: 'us-8', rank: 8, title: 'Beautiful Things', artist: 'Benson Boone', cover: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=300&auto=format&fit=crop&q=80', url: '', trend: 'down', change: 1, duration: '3:00', genre: 'Pop' },
    { id: 'us-9', rank: 9, title: 'Lovin On Me', artist: 'Jack Harlow', cover: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&auto=format&fit=crop&q=80', url: '', trend: 'same', change: 0, duration: '2:18', genre: 'Rap Việt' },
    { id: 'us-10', rank: 10, title: 'Snooze', artist: 'SZA', cover: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&auto=format&fit=crop&q=80', url: '', trend: 'up', change: 1, duration: '3:21', genre: 'R&B' },
  ]
};

export const MOOD_CHIPS = ['Tất cả', 'Lo-fi', 'Rap Việt', 'V-Pop', 'EDM', 'R&B', 'Acoustic', 'Chill', 'Indie'];

export const NEW_RELEASES = [
  { id: 'new-1', title: 'Thiên Lý Ơi (Studio Mix)', artist: 'J97', cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80', date: 'Vừa xong' },
  { id: 'new-2', title: 'Tết Đi Rồi Tính', artist: 'B Ray x Đạt G', cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80', date: '2 giờ trước' },
  { id: 'new-3', title: 'Nắng Âm Xa Dần', artist: 'Sơn Tùng M-TP', cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80', date: 'Hôm qua' },
  { id: 'new-4', title: 'Midnight City Beats', artist: 'M2 Studio', cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=80', date: '3 ngày trước' },
  { id: 'new-5', title: 'Saigon Nights', artist: 'Vương Anh Tú', cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=80', date: '4 ngày trước' },
  { id: 'new-6', title: 'Hoa Tuyết Lofi', artist: 'Lofi Chill Team', cover: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=300&auto=format&fit=crop&q=80', date: '1 tuần trước' },
];
