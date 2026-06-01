import { Skeleton } from "@/components/atoms/ui/skeleton"

export function AlbumSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="space-y-1.5 px-1">
        <Skeleton className="h-4 w-3/4 rounded-md" />
        <Skeleton className="h-3.5 w-1/2 rounded-md opacity-70" />
      </div>
    </div>
  )
}
