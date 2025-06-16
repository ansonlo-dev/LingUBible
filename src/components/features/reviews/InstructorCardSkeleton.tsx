import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function InstructorCardSkeleton() {
  return (
    <Card className="course-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 聯絡信息骨架 */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 flex-shrink-0" />
          <Skeleton className="h-4 flex-1" />
        </div>

        {/* 統計信息骨架 */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-6 w-8 mx-auto" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-6 w-8 mx-auto" />
          </div>
        </div>

        {/* 評分骨架 */}
        <div className="text-center space-y-2">
          <Skeleton className="h-3 w-12 mx-auto" />
          <div className="flex items-center justify-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-4 w-4" />
            ))}
            <Skeleton className="h-4 w-8 ml-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 