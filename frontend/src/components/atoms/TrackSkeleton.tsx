import { Skeleton } from "@/components/atoms/ui/skeleton"

export function TrackSkeleton() {
  return (
    <div className="flex items-center gap-4 py-2 px-1">
      <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-[40%] rounded-md" />
        <Skeleton className="h-3 w-[25%] rounded-md opacity-70" />
      </div>
      <Skeleton className="h-4 w-10 rounded-md opacity-50" />
    </div>
  )
}
