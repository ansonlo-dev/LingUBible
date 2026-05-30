import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{options.title || t('loginRequired.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {options.description || t('loginRequired.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/login')}>
              {t('auth.login')}
            </AlertDialogAction>
            <AlertDialogAction onClick={() => navigate('/register')}>
              {t('auth.signUp')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LoginRequiredContext.Provider>
  );
};
