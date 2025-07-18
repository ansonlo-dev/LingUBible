import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle, AlertTriangle, Lock, Eye, EyeOff, BookOpen } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordInput } from '@/components/ui/password-input';
import { PasswordStrengthChecker } from '@/components/auth/PasswordStrengthChecker';
import { authService, AuthError } from '@/services/api/auth';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { login } = useAuth();
  
  // URL 參數
  const userId = searchParams.get('userId');
  const token = searchParams.get('token');
  
  // 表單狀態
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [countdown, setCountdown] = useState(3);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);

  // 驗證 URL 參數和 token
  useEffect(() => {
    const validateToken = async () => {
      if (!userId || !token) {
        setError(t('auth.invalidResetLink'));
        setIsValidatingToken(false);
        return;
      }

      try {
        setIsValidatingToken(true);
        await authService.validatePasswordResetToken(userId, token);
        setIsTokenValid(true);
        setError('');
      } catch (err: any) {
        console.error('Token validation failed:', err);
        setIsTokenValid(false);
        
        // 處理 AuthError 的翻譯鍵值
        if (err instanceof AuthError && err.messageKey) {
          setError(t(err.messageKey));
        } else if (err.message?.includes('already been used')) {
          setError(t('auth.resetLinkAlreadyUsed'));
        } else if (err.message?.includes('Invalid token') || 
                   err.message?.includes('Token expired')) {
          setError(t('auth.invalidOrExpiredResetLink'));
        } else {
          setError(err.message || t('auth.invalidResetLink'));
        }
      } finally {
        setIsValidatingToken(false);
      }
    };

    validateToken();
  }, [userId, token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 驗證輸入
    if (!password.trim()) {
      setError(t('auth.passwordRequired'));
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

    if (!userId || !token || !isTokenValid) {
      setError(t('auth.invalidResetLink'));
      return;
    }

    setIsLoading(true);

    try {
      // 使用自定義的密碼重設完成功能
      await authService.completeCustomPasswordReset(userId, token, password);
      
      setIsSuccess(true);
      
      // 開始倒計時動畫
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/login', { 
              state: { 
                message: t('auth.passwordResetSuccess'),
                email: userEmail 
              }
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (err: any) {
      console.error('Password reset failed:', err);
      
      // 處理 AuthError 的翻譯鍵值
      if (err instanceof AuthError && err.messageKey) {
        setError(t(err.messageKey));
      } else if (err.message?.includes('Invalid credentials') || 
          err.message?.includes('Invalid recovery')) {
        setError(t('auth.invalidOrExpiredResetLink'));
      } else if (err.message?.includes('Password must be between 8 and 256 characters')) {
        setError(t('auth.passwordLengthError'));
      } else if (err.message?.includes('Rate limit')) {
        setError(t('auth.rateLimitExceeded'));
      } else {
        setError(err.message || t('auth.passwordResetFailed'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 成功頁面
  if (isSuccess) {
    return (
      <div className="h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4 landscape:p-2">
        <div className="w-full max-w-md flex flex-col max-h-full">
          {/* Logo and Title */}
          <div className="text-center mb-4 landscape:mb-2 flex-shrink-0">
            <Link to="/" className="inline-flex items-center gap-2 text-2xl lg:text-3xl landscape:text-xl font-bold text-primary hover:opacity-80 transition-opacity">
              <BookOpen className="h-8 w-8 lg:h-10 lg:w-10 landscape:h-6 landscape:w-6" />
              LingUBible
            </Link>
            <p className="text-muted-foreground mt-2 landscape:mt-1 landscape:text-sm">{t('auth.passwordResetComplete')}</p>
          </div>

          <Card className="glass-card flex flex-col flex-1 min-h-0">
            <CardHeader className="text-center flex-shrink-0 landscape:py-4">
              <div className="mx-auto mb-4 landscape:mb-2 h-12 w-12 landscape:h-10 landscape:w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 landscape:h-5 landscape:w-5 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl landscape:text-xl">{t('auth.passwordResetSuccess')}</CardTitle>
              <CardDescription className="landscape:text-sm">
                {t('auth.passwordResetSuccessDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 overflow-y-auto">
              <div className="text-center text-sm text-muted-foreground">
                <p>{t('auth.redirectingToLogin')}</p>
                <div className="mt-4 flex items-center justify-center">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-blue-700 dark:text-blue-300 font-medium">
                      {countdown}s
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Button asChild className="w-full">
                  <Link to="/login">
                    {t('auth.backToLogin')}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 安全連接頁腳 */}
          <div className="mt-4 text-center flex-shrink-0">
            <Link to="/faq#password-safety" className="inline-flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-sm text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
              <Lock className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span>{t('auth.secureConnection')}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4 landscape:p-2">
      <div className="w-full max-w-md flex flex-col max-h-full">
        {/* Logo and Title */}
        <div className="text-center mb-4 landscape:mb-2 flex-shrink-0">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl lg:text-3xl landscape:text-xl font-bold text-primary hover:opacity-80 transition-opacity">
            <BookOpen className="h-8 w-8 lg:h-10 lg:w-10 landscape:h-6 landscape:w-6" />
            LingUBible
          </Link>
          <p className="text-muted-foreground mt-2 landscape:mt-1 landscape:text-sm">{t('auth.resetPassword')}</p>
        </div>

        <Card className="glass-card flex flex-col flex-1 min-h-0">
          <CardHeader className="text-center flex-shrink-0 landscape:py-4">
            <div className="mx-auto mb-4 landscape:mb-2 h-12 w-12 landscape:h-10 landscape:w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Lock className="h-6 w-6 landscape:h-5 landscape:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl landscape:text-xl">{t('auth.setNewPassword')}</CardTitle>
            <CardDescription className="landscape:text-sm">
              {t('auth.setNewPasswordDescription')}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto">
            {isValidatingToken ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">{t('auth.validatingResetLink')}</p>
              </div>
            ) : !isTokenValid ? (
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                    {t('auth.invalidResetLinkTitle')}
                  </h3>
                  <p className="text-muted-foreground">{error}</p>
                </div>
                <div className="space-y-2">
                  <Button asChild className="w-full">
                    <Link to="/forgot-password">
                      {t('auth.requestNewResetLink')}
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full">
                    <Link to="/login" className="flex items-center justify-center">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {t('auth.backToLogin')}
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
              {/* 新密碼 */}
              <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                <Label htmlFor="password" className="md:w-32 md:flex-shrink-0 md:text-right">{t('auth.newPassword')}</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.newPasswordPlaceholder')}
                  disabled={isLoading}
                  required
                  className="md:flex-1 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
              </div>

              {/* 密碼強度檢查器 */}
              {password && (
                <div className="flex flex-col md:flex-row md:space-x-4">
                  <div className="md:w-32 md:flex-shrink-0"></div>
                  <div className="md:flex-1">
                    <PasswordStrengthChecker
                      password={password}
                      onValidationChange={setIsPasswordValid}
                    />
                  </div>
                </div>
              )}

              {/* 確認密碼 */}
              <div className="flex flex-col md:flex-row md:items-start space-y-2 md:space-y-0 md:space-x-4">
                <Label htmlFor="confirmPassword" className="md:w-32 md:flex-shrink-0 md:text-right md:pt-2">{t('auth.confirmPassword')}</Label>
                <div className="md:flex-1 space-y-2">
                  <PasswordInput
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('auth.confirmPasswordPlaceholder')}
                    disabled={isLoading}
                    required
                    className="placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                  
                  {/* 密碼不一致提示 */}
                  {confirmPassword && password !== confirmPassword && (
                    <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                      <AlertDescription className="text-red-600 dark:text-red-400">
                        {t('auth.passwordMismatch')}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-red-600 dark:text-red-400">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-xs text-muted-foreground text-center mt-4 space-y-1">
                <p>• {t('auth.passwordRequirements')}</p>
                <p>• {t('auth.passwordSecurityTip')}</p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={
                  isLoading || 
                  !password.trim() || 
                  !confirmPassword.trim() || 
                  !isPasswordValid || 
                  password !== confirmPassword ||
                  !userId ||
                  !token
                }
              >
                {isLoading ? t('auth.resetting') : t('auth.resetPassword')}
              </Button>

              <Button asChild variant="ghost" className="w-full">
                <Link to="/login" className="flex items-center justify-center">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('auth.backToLogin')}
                </Link>
              </Button>
            </form>
            )}
          </CardContent>
        </Card>

        {/* 安全連接頁腳 */}
        <div className="mt-4 text-center flex-shrink-0">
          <Link to="/faq#password-safety" className="inline-flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-sm text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
            <Lock className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span>{t('auth.secureConnection')}</span>
          </Link>
          <div className="mt-4 space-x-4 text-xs text-muted-foreground">
            <Link to="/faq" className="hover:underline">{t('footer.faq')}</Link>
            <Link to="/contact" className="hover:underline">{t('auth.contact')}</Link>
            <Link to="/terms" className="hover:underline">{t('auth.terms')}</Link>
            <Link to="/privacy" className="hover:underline">{t('auth.privacy')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
} 