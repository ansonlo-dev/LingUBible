import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle, AlertTriangle, User, Lightbulb } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { StudentVerificationInput } from './StudentVerificationInput';
import { PasswordStrengthChecker } from './PasswordStrengthChecker';
import { UsernameValidator } from "@/utils/auth/usernameValidator";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isStudentVerified, setIsStudentVerified] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuggestion, setUsernameSuggestion] = useState('');
  const { t } = useLanguage();
  const { 
    login, 
    register, 
    sendStudentVerificationCode, 
    verifyStudentCode, 
    isStudentEmailVerified,
    getVerificationRemainingTime 
  } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // 當郵箱改變時生成用戶名建議
  useEffect(() => {
    if (isSignUp && email && !username) {
      const suggestion = UsernameValidator.generateSuggestion(email);
      setUsernameSuggestion(suggestion);
    }
  }, [isSignUp, email, username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // 基本驗證
    if (!email || !password) {
      setError('請填寫所有必填欄位');
      return;
    }

    if (isSignUp) {
      if (!username) {
        setError('請輸入用戶名');
        return;
      }

      if (!isUsernameValid) {
        setError('請輸入有效的用戶名');
        return;
      }

      if (!termsAccepted) {
        setError(t('auth.mustAgreeTerms'));
        return;
      }
      
      if (!isStudentVerified) {
        setError(t('auth.pleaseVerifyStudentEmail'));
        return;
      }

      if (!isPasswordValid) {
        setError(t('auth.passwordNotSecure'));
        return;
      }

      if (password !== confirmPassword) {
        setError(t('auth.passwordMismatch'));
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        await register(email, password, username);
        onClose();
      } else {
        await login(email, password);
        onClose();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // 處理不同類型的錯誤
      if (err?.message?.includes('請先驗證您的嶺南人郵件地址')) {
        setError(t('auth.pleaseVerifyStudentEmail'));
      } else if (err?.message?.includes('Invalid credentials')) {
        setError('郵件地址或密碼錯誤');
      } else if (err?.message?.includes('user with the same email already exists')) {
        setError('此郵件地址已被註冊');
      } else if (err?.message?.includes('Password must be between 8 and 256 characters') || 
                 err?.message?.includes('Invalid `password` param: Password must be between 8 and 256 characters long')) {
        setError(t('auth.passwordTooShort'));
      } else if (err?.message?.includes('Rate limit') || 
                 err?.message?.includes('Too many requests') ||
                 err?.message?.includes('Rate limit for the current endpoint has been exceeded')) {
        setError(t('auth.rateLimitExceeded'));
      } else if (err?.message?.includes('session is active') || err?.message?.includes('session is prohibited')) {
        setError('檢測到現有登入狀態，正在嘗試重新登入...');
        // 稍後自動重試
        setTimeout(() => {
          setError('');
          if (!isSignUp) {
            handleSubmit(e);
          }
        }, 1500);
        return;
      } else {
        setError(err?.message || (isSignUp ? '註冊失敗' : '登入失敗'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setIsStudentVerified(false);
    setIsPasswordValid(false);
    setIsUsernameValid(false);
    setUsernameError('');
    setUsernameSuggestion('');
    setTermsAccepted(false);
    onClose();
  };

  const handleModeSwitch = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setIsStudentVerified(false);
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setIsPasswordValid(false);
    setIsUsernameValid(false);
    setUsernameError('');
    setUsernameSuggestion('');
    setTermsAccepted(false);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    
    // 驗證用戶名
    const validation = UsernameValidator.validate(newUsername);
    setIsUsernameValid(validation.isValid);
    setUsernameError(validation.error || '');
  };

  const handleUseSuggestion = () => {
    if (usernameSuggestion) {
      setUsername(usernameSuggestion);
      const validation = UsernameValidator.validate(usernameSuggestion);
      setIsUsernameValid(validation.isValid);
      setUsernameError(validation.error || '');
      setUsernameSuggestion('');
    }
  };

  const handleStudentVerified = () => {
    setIsStudentVerified(true);
    setError('');
  };

  const handlePasswordValidationChange = (isValid: boolean) => {
    setIsPasswordValid(isValid);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isSignUp ? t('auth.signUp') : t('auth.signIn')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value.toLowerCase());
                setIsStudentVerified(false); // 重置驗證狀態當郵件改變時
              }}
              placeholder={isSignUp ? t('auth.emailPlaceholder') : t('auth.enterEmail')}
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>
          
          {/* 註冊時顯示嶺南人驗證 */}
          {isSignUp && email && (
            <StudentVerificationInput
              email={email}
              onSendCode={sendStudentVerificationCode}
              onVerifyCode={verifyStudentCode}
              getRemainingTime={getVerificationRemainingTime}
              onCodeVerified={handleStudentVerified}
              disabled={loading}
            />
          )}
          
          {/* 驗證成功提示 */}
          {isSignUp && isStudentVerified && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                <p className="text-sm text-green-600 dark:text-green-400">
                  {t('auth.studentVerificationSuccess')}
                </p>
              </div>
            </div>
          )}

          {/* 註冊時顯示用戶名字段 */}
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('auth.username')}
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder={t('auth.usernamePlaceholder')}
                autoComplete="username"
                required
                disabled={loading}
                className={usernameError ? 'border-red-500' : isUsernameValid && username ? 'border-green-500' : ''}
              />
              
              {/* 用戶名驗證提示 */}
              {usernameError && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {usernameError}
                </p>
              )}
              
              {isUsernameValid && username && (
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {t('auth.usernameAvailable')}
                </p>
              )}
              
              {/* 用戶名建議 */}
              {usernameSuggestion && !username && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-blue-600 dark:text-blue-400">
                        {t('auth.usernameSuggestion')}<strong>{usernameSuggestion}</strong>
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUseSuggestion}
                      className="text-xs"
                    >
                      {t('auth.useSuggestion')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.enterPassword')}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              disabled={loading}
            />
          </div>

          {/* 註冊時顯示密碼強度檢查器 */}
          {isSignUp && password && (
            <PasswordStrengthChecker
              password={password}
              email={email}
              onValidationChange={handlePasswordValidationChange}
            />
          )}
          
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.confirmPasswordPlaceholder')}
                autoComplete="new-password"
                required
                disabled={loading}
              />
              {/* 密碼確認檢查 */}
              {confirmPassword && password !== confirmPassword && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {t('auth.passwordMismatch')}
                </p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  {t('auth.passwordMatch')}
                </p>
              )}
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
            </div>
          )}
          
          {/* Terms Agreement Checkbox for Sign Up */}
          {isSignUp && (
            <div className="flex items-center justify-center space-x-2">
              <Checkbox
                id="termsAcceptedModal"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
              />
              <Label 
                htmlFor="termsAcceptedModal" 
                className="text-sm font-normal cursor-pointer"
              >
                {t('auth.termsCheckbox')}{' '}
                <a href="/terms" target="_blank" className="text-primary hover:underline">
                  {t('auth.termsOfService')}
                </a>{' '}
                {t('auth.and')}{' '}
                <a href="/privacy" target="_blank" className="text-primary hover:underline">
                  {t('auth.privacyPolicy')}
                </a>
              </Label>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full gradient-primary hover:opacity-90 text-white"
            disabled={loading || (isSignUp && (!isStudentVerified || !isUsernameValid || !isPasswordValid || password !== confirmPassword || !termsAccepted))}
          >
            {loading ? t('auth.processing') : (isSignUp ? t('auth.signUp') : t('auth.signIn'))}
          </Button>
          
          <div className="text-center">
            <button
              type="button"
              onClick={handleModeSwitch}
              className="text-sm text-muted-foreground hover:text-primary"
              disabled={loading}
            >
              {isSignUp 
                ? t('auth.alreadyHaveAccount')
                : t('auth.dontHaveAccount')
              }
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
