import { TrackSkeleton } from '@/components/atoms/TrackSkeleton';

export default function Loading() {
  return (
    <main className="p-4 space-y-8 animate-pulse">
      <div className="flex items-center space-x-4">
        <div className="w-24 h-24 bg-muted rounded-lg" />
        <div className="space-y-2">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
      </div>
      
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <TrackSkeleton key={i} />
        ))}
      </div>
    </main>
  );
}
