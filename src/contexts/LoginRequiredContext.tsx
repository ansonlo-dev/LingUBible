import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface LoginRequiredOptions {
  /** Optional custom title; falls back to a generic "login required" title. */
  title?: string;
  /** Optional custom description; falls back to a generic message. */
  description?: string;
}

interface LoginRequiredContextValue {
  /**
   * Show a consistent "you must be logged in" prompt with Login / Sign Up CTAs.
   * Used by every guest-gated action (favorite, syllabus, write review, …) so the
   * behaviour is identical everywhere instead of mixing toasts / navigation / dialogs.
   */
  promptLogin: (options?: LoginRequiredOptions) => void;
}

const LoginRequiredContext = createContext<LoginRequiredContextValue | null>(null);

export const useLoginRequired = (): LoginRequiredContextValue['promptLogin'] => {
  const ctx = useContext(LoginRequiredContext);
  if (!ctx) {
    throw new Error('useLoginRequired must be used within a LoginRequiredProvider');
  }
  return ctx.promptLogin;
};

export const LoginRequiredProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<LoginRequiredOptions>({});

  const promptLogin = useCallback((opts: LoginRequiredOptions = {}) => {
    setOptions(opts);
    setOpen(true);
  }, []);

  return (
    <LoginRequiredContext.Provider value={{ promptLogin }}>
      {children}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="max-w-[min(32rem,calc(100vw-2rem))]">
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title || t('loginRequired.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {options.description || t('loginRequired.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <div className="flex gap-3">
              <AlertDialogAction className="flex-1" onClick={() => navigate('/register')}>
                {t('auth.signUp')}
              </AlertDialogAction>
              <AlertDialogAction className="flex-1" onClick={() => navigate('/login')}>
                {t('auth.login')}
              </AlertDialogAction>
            </div>
            <AlertDialogCancel className="w-full mt-0">{t('common.cancel')}</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </LoginRequiredContext.Provider>
  );
};
