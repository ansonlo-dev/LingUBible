import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle, AlertTriangle, Lock, Eye, EyeOff } from 'lucide-react';
import { BookOpenIcon } from '@/components/icons/BookOpenIcon';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PasswordInput } from '@/components/ui/password-input';
import { PasswordStrengthChecker } from '@/components/auth/PasswordStrengthChecker';
import { authService } from '@/services/api/auth';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { login } = useAuth();
  
  // URL 參數
  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');
  
  // 表單狀態
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // 驗證 URL 參數
  useEffect(() => {
    if (!userId || !secret) {
      setError(t('auth.invalidResetLink'));
    }
  }, [userId, secret, t]);

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

    if (!userId || !secret) {
      setError(t('auth.invalidResetLink'));
      return;
    }

    setIsLoading(true);

    try {
      // 使用 Appwrite 的密碼重設完成功能
      await authService.completePasswordReset(userId, secret, password);
      
      setIsSuccess(true);
      
      // 3秒後自動跳轉到登入頁面
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: t('auth.passwordResetSuccess'),
            email: userEmail 
          }
        });
      }, 3000);
      
    } catch (err: any) {
      console.error('密碼重設失敗:', err);
      
      if (err.message?.includes('Invalid credentials') || 
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
      <div className="h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
        <div className="w-full max-w-md flex flex-col max-h-full">
          {/* Logo and Title */}
          <div className="text-center mb-4 flex-shrink-0">
            <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
              <BookOpenIcon className="h-8 w-8" />
              LingUBible
            </Link>
            <p className="text-muted-foreground mt-2">{t('auth.passwordResetComplete')}</p>
          </div>

          <Card className="glass-card flex flex-col flex-1 min-h-0">
            <CardHeader className="text-center flex-shrink-0">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">{t('auth.passwordResetSuccess')}</CardTitle>
              <CardDescription>
                {t('auth.passwordResetSuccessDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 overflow-y-auto">
              <div className="text-center text-sm text-muted-foreground">
                <p>{t('auth.redirectingToLogin')}</p>
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
            <div className="inline-flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-sm text-green-700 dark:text-green-300">
              <Lock className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span>{t('auth.secureConnection')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="w-full max-w-md flex flex-col max-h-full">
        {/* Logo and Title */}
        <div className="text-center mb-4 flex-shrink-0">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
            <BookOpenIcon className="h-8 w-8" />
            LingUBible
          </Link>
          <p className="text-muted-foreground mt-2">{t('auth.resetPassword')}</p>
        </div>

        <Card className="glass-card flex flex-col flex-1 min-h-0">
          <CardHeader className="text-center flex-shrink-0">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl">{t('auth.setNewPassword')}</CardTitle>
            <CardDescription>
              {t('auth.setNewPasswordDescription')}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 新密碼 */}
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.newPassword')}</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.newPasswordPlaceholder')}
                  disabled={isLoading}
                  required
                />
              </div>

              {/* 密碼強度檢查器 */}
              {password && (
                <PasswordStrengthChecker
                  password={password}
                  onValidationChange={setIsPasswordValid}
                />
              )}

              {/* 確認密碼 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                <PasswordInput
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  disabled={isLoading}
                  required
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

              {error && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-red-600 dark:text-red-400">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-xs text-muted-foreground space-y-1">
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
                  !secret
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
          </CardContent>
        </Card>

        {/* 安全連接頁腳 */}
        <div className="mt-4 text-center flex-shrink-0">
          <div className="inline-flex items-center space-x-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-sm text-green-700 dark:text-green-300">
            <Lock className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span>{t('auth.secureConnection')}</span>
          </div>
          <div className="mt-4 space-x-4 text-xs text-muted-foreground">
            <Link to="/contact" className="hover:underline">{t('auth.contact')}</Link>
            <Link to="/terms" className="hover:underline">{t('auth.terms')}</Link>
            <Link to="/privacy" className="hover:underline">{t('auth.privacy')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
} 