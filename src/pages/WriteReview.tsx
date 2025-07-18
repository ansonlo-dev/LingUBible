import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import ReviewSubmissionForm from '@/components/features/reviews/ReviewSubmissionForm';

const WriteReview = () => {
  const { courseCode } = useParams<{ courseCode?: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const editReviewId = searchParams.get('edit');

  return (
    <div className="container mx-auto px-4 py-8">
      <ReviewSubmissionForm 
        preselectedCourseCode={courseCode} 
        editReviewId={editReviewId || undefined}
      />
    </div>
  );
};

export default WriteReview; 