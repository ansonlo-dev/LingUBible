// 評論表單草稿：純被動 localStorage 儲存（無任何背景輪詢/自動重讀）。
// 使用者輸入時 debounce 寫入，重新進入表單時一次性還原，提交成功或捨棄時清除。

export interface ReviewDraftEvaluation {
  instructorName: string;
  sessionType: string;
  teachingScore: number | null;
  gradingScore: number | null;
  comments: string;
  hasMidterm: boolean;
  hasFinal: boolean;
  hasQuiz: boolean;
  hasGroupProject: boolean;
  hasIndividualAssignment: boolean;
  hasPresentation: boolean;
  hasReading: boolean;
  hasAttendanceRequirement: boolean;
  hasServiceLearning: boolean;
  serviceLearningType: 'compulsory' | 'optional';
  serviceLearningDescription: string;
  notAttended: boolean;
}

export interface ReviewDraft {
  version: number;
  savedAt: string;
  selectedCourse: string;
  selectedTerm: string;
  selectedInstructors: string[];
  workload: number | null;
  difficulty: number | null;
  usefulness: number | null;
  grade: string;
  courseComments: string;
  isAnonymous: boolean;
  reviewLanguage: string;
  instructorEvaluations: ReviewDraftEvaluation[];
  currentStep: number;
}

const DRAFT_VERSION = 1;
const DRAFT_PREFIX = 'lingubible_review_draft';
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

// 每位使用者：新評論一份草稿；每筆編輯中的評論各一份草稿
export const getReviewDraftKey = (userId: string, editReviewId?: string): string =>
  `${DRAFT_PREFIX}:${userId}:${editReviewId ? `edit:${editReviewId}` : 'new'}`;

export const loadReviewDraft = (key: string): ReviewDraft | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const draft = JSON.parse(raw) as ReviewDraft;
    if (!draft || draft.version !== DRAFT_VERSION) {
      localStorage.removeItem(key);
      return null;
    }
    if (Date.now() - new Date(draft.savedAt).getTime() > DRAFT_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    if (typeof draft.selectedCourse !== 'string' || !Array.isArray(draft.instructorEvaluations)) {
      localStorage.removeItem(key);
      return null;
    }
    return draft;
  } catch {
    return null;
  }
};

export const saveReviewDraft = (key: string, draft: Omit<ReviewDraft, 'version' | 'savedAt'>): void => {
  try {
    localStorage.setItem(key, JSON.stringify({
      ...draft,
      version: DRAFT_VERSION,
      savedAt: new Date().toISOString(),
    }));
  } catch {
    // localStorage 已滿或不可用時靜默略過，不影響表單操作
  }
};

export const clearReviewDraft = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

// 草稿是否有值得保留的內容（避免存一堆空草稿）
export const draftHasContent = (draft: Omit<ReviewDraft, 'version' | 'savedAt'>): boolean => {
  return !!(
    draft.workload !== null ||
    draft.difficulty !== null ||
    draft.usefulness !== null ||
    draft.grade ||
    draft.courseComments.trim() ||
    draft.instructorEvaluations.some(e =>
      e.teachingScore !== null || e.gradingScore !== null || e.comments.trim() ||
      e.hasMidterm || e.hasFinal || e.hasQuiz || e.hasGroupProject ||
      e.hasIndividualAssignment || e.hasPresentation || e.hasReading || e.hasAttendanceRequirement
    )
  );
};
