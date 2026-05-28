import { Skeleton } from "@/components/atoms/ui/skeleton"

export function TrackSkeleton() {
  return (
    <div className="flex items-center space-x-4 py-2">
      <Skeleton className="h-12 w-12 rounded-md" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-4 w-12" />
    </div>
  )
}
