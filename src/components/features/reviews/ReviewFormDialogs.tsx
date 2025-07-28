import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

interface ReviewFormDialogsProps {
  // Main exit dialog
  showMainExitConfirm: boolean;
  setShowMainExitConfirm: (show: boolean) => void;
  onConfirmMainExit: () => void;

  // Submit confirmation dialog
  showSubmitConfirm: boolean;
  setShowSubmitConfirm: (show: boolean) => void;
  onConfirmSubmit: () => void;
  isEditMode: boolean;
  submitting: boolean;

  // Celebration dialog
  showCelebration: boolean;
  setShowCelebration: (show: boolean) => void;
}

export const ReviewFormDialogs: React.FC<ReviewFormDialogsProps> = ({
  showMainExitConfirm,
  setShowMainExitConfirm,
  onConfirmMainExit,
  showSubmitConfirm,
  setShowSubmitConfirm,
  onConfirmSubmit,
  isEditMode,
  submitting,
  showCelebration,
  setShowCelebration,
}) => {
  const { t } = useLanguage();

  return (
    <>
      {/* Main Exit Confirmation Dialog */}
      <AlertDialog open={showMainExitConfirm} onOpenChange={setShowMainExitConfirm}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 sm:rounded-lg rounded-xl mx-auto max-w-[calc(100vw-2rem)] sm:max-w-lg p-6">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('review.exitConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('review.exitConfirmDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row gap-3 justify-center pt-2">
            <AlertDialogCancel className="flex-1 min-w-0">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmMainExit} className="flex-1 min-w-0">
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 sm:rounded-lg rounded-xl mx-auto max-w-[calc(100vw-2rem)] sm:max-w-lg p-6">
          <AlertDialogHeader>
            <AlertDialogTitle>{isEditMode ? t('review.confirmUpdate') : t('review.confirmSubmit')}</AlertDialogTitle>
            <AlertDialogDescription>
              {isEditMode 
                ? t('review.confirmUpdateDescription') 
                : t('review.confirmSubmitDescription')
              }
              <br className="hidden sm:block" />
              {t('review.confirmContent')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row gap-3 justify-center pt-2">
            <AlertDialogCancel disabled={submitting} className="flex-1 min-w-0">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onConfirmSubmit}
              disabled={submitting}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex-1 min-w-0"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('review.submitting')}
                </>
              ) : (
                isEditMode ? t('review.updateReview') : t('review.submitReview')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Celebration Dialog */}
      <AlertDialog open={showCelebration} onOpenChange={setShowCelebration}>
        <AlertDialogContent className="bg-white dark:bg-gray-900 text-center sm:rounded-lg rounded-xl m-4 sm:mx-auto max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <AlertDialogHeader className="items-center">
            <div className="relative mb-4">
              {/* Animated sparkles background */}
              <div className="absolute inset-0 flex justify-center items-center">
                <Sparkles className="h-16 w-16 text-yellow-400 animate-pulse" />
              </div>
              {/* Checkmark icon */}
              <div className="relative z-10 flex justify-center items-center">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
            </div>
            <AlertDialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              🎉 {t('review.thankYou')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed mt-2">
              {t('review.contributionMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center">
            <Button 
              onClick={() => setShowCelebration(false)}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-medium px-8 py-2"
            >
              {t('common.awesome')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};