import { AlbumSkeleton } from '@/components/atoms/AlbumSkeleton';
import { TrackSkeleton } from '@/components/atoms/TrackSkeleton';

export default function Loading() {
  return (
    <main className="p-4 space-y-8 animate-pulse">
      <div className="h-8 w-32 bg-muted rounded mb-6" />
      
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <AlbumSkeleton key={i} />
        ))}
      </div>

      <div className="space-y-4 pt-4">
        <div className="h-6 w-24 bg-muted rounded mb-4" />
        {[1, 2, 3].map((i) => (
          <TrackSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
