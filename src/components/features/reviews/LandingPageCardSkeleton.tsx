import { CourseCardSkeleton } from './CourseCardSkeleton';
import { InstructorCardSkeleton } from './InstructorCardSkeleton';

interface LandingPageCardSkeletonProps {
  type: 'course' | 'instructor';
  count?: number;
}

export function LandingPageCardSkeleton({ type, count = 6 }: LandingPageCardSkeletonProps) {
  const SkeletonComponent = type === 'course' ? CourseCardSkeleton : InstructorCardSkeleton;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} />
      ))}
    </div>
  );
}