import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRecaptcha } from '@/contexts/RecaptchaContext';
import { useLoginRecaptcha } from '@/hooks/useSmartRecaptcha';
import { BookOpen, Lock, AlertTriangle } from 'lucide-react';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';

// 檢查郵件是否為有效的學生郵件
const isValidStudentEmail = (email: string): boolean => {
  const emailLower = email.toLowerCase();
  // 使用正則表達式確保完全匹配，防止像 abc@ln.edsf.hk 這樣的郵件通過
  const validEmailPattern = /^[a-zA-Z0-9._%+-]+@(ln\.hk|ln\.edu\.hk)$/;
  return validEmailPattern.test(emailLower);
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLinkSuccess, setGoogleLinkSuccess] = useState(false);
  
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const { isRecaptchaLoaded } = useRecaptcha();
  const { verifyLogin, recordFailure, resetFailures, needsRecaptcha } = useLoginRecaptcha();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // 執行 reCAPTCHA 驗證（智能判斷是否需要）
      const recaptchaResult = await verifyLogin({
        onError: (error) => {
          setError(error);
          setLoading(false);
        }
      });

      if (!recaptchaResult.success) {
        // 錯誤已在 onError 回調中處理
        return;
      }

      await login(email, password, rememberMe);
      
      // 登入成功，重置失敗計數
      resetFailures();
      
      navigate('/'); // 登入成功後導向首頁
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // 記錄登入失敗
      recordFailure();
      
      // 提供更詳細的錯誤處理
      if (err?.message?.includes('Invalid credentials')) {
        setError(t('auth.invalidCredentials'));
      } else if (err?.message?.includes('Password must be between 8 and 256 characters') || 
                 err?.message?.includes('Invalid `password` param: Password must be between 8 and 256 characters long')) {
        setError(t('auth.passwordTooShort'));
      } else if (err?.message?.includes('Rate limit') || 
                 err?.message?.includes('Too many requests') ||
                 err?.message?.includes('Rate limit for the current endpoint has been exceeded')) {
        setError(t('auth.rateLimitExceeded'));
      } else if (err?.message?.includes('session is active') || err?.message?.includes('session is prohibited')) {
        setError(t('auth.sessionConflict'));
        // 稍後自動重試
        setTimeout(() => {
          setError('');
          handleSubmit(e);
        }, 1500);
        return;
      } else if (err?.message?.includes('User (role: guests) missing scope')) {
        setError(t('auth.accountPermissionDenied'));
      } else if (err?.message?.includes('Network')) {
        setError(t('auth.networkError'));
      } else {
        // 使用通用的錯誤訊息
        setError(err?.message || t('auth.loginFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value.toLowerCase();
    setEmail(newEmail);
    setError('');
  };

  // 載入時檢查是否有保存的郵件地址
  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail');
    const rememberMeFlag = localStorage.getItem('rememberMe');
    if (savedEmail && rememberMeFlag) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    
    // 檢查是否是 Google 帳戶連結成功後的重定向
    const googleLinkSuccessNeedRelogin = localStorage.getItem('googleLinkSuccessNeedRelogin');
    if (googleLinkSuccessNeedRelogin) {
      localStorage.removeItem('googleLinkSuccessNeedRelogin');
      setGoogleLinkSuccess(true);
      setError(''); // 確保不是錯誤狀態
    }
  }, []);

  return (
    <div className="h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="w-full max-w-md flex flex-col max-h-full">
        {/* Logo and Title */}
        <div className="text-center mb-4 flex-shrink-0">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
            <BookOpen className="h-8 w-8" />
            LingUBible
          </Link>
          <p className="text-muted-foreground mt-2">{t('auth.welcomeBack')}</p>
        </div>

        <Card className="glass-card flex flex-col flex-1 min-h-0">
          <CardHeader className="text-center flex-shrink-0">
            <CardTitle className="text-2xl">{t('auth.signIn')}</CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4 login-form">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder={t('auth.enterEmail')}
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.enterPassword')}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />
              </div>

              {/* 記住我選項 */}
              <div className="flex items-center justify-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={loading}
                />
                <Label 
                  htmlFor="rememberMe" 
                  className="text-sm font-normal cursor-pointer"
                >
                  {t('auth.rememberMe')}
                </Label>
              </div>
              
              {googleLinkSuccess && (
                <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                  <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-600 dark:text-green-400">
                    {t('oauth.linkSuccessNeedRelogin')}
                  </AlertDescription>
                </Alert>
              )}
              
              {error && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-red-600 dark:text-red-400">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? t('auth.processing') : t('auth.signIn')}
              </Button>

              {/* 分隔線 */}
              <div className="flex items-center">
                <div className="flex-1 border-t border-border"></div>
                <span className="px-4 text-xs uppercase text-muted-foreground">
                  {t('auth.or')}
                </span>
                <div className="flex-1 border-t border-border"></div>
              </div>

              {/* Google 登入按鈕 */}
              <GoogleLoginButton disabled={loading} />
              
              <p className="text-center text-sm text-muted-foreground">
                {t('auth.noAccount')}{' '}
                <Link to="/register" className="text-primary hover:underline">
                  {t('auth.signUp')}
                </Link>
              </p>

              <div className="flex items-center justify-between text-sm">
                <Link 
                  to="/" 
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  ← {t('auth.backToHome')}
                </Link>
                <Link 
                  to="/forgot-password" 
                  className="text-primary hover:underline"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
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