import { Skeleton } from "@/components/atoms/ui/skeleton"
import { Card, CardContent } from "@/components/atoms/ui/card"

export function AlbumSkeleton() {
  return (
    <Card className="overflow-hidden border-none bg-transparent shadow-none">
      <CardContent className="p-0">
        <Skeleton className="aspect-square w-full rounded-md" />
        <div className="space-y-2 py-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </CardContent>
    </Card>
  )
}
