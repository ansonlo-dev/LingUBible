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
import { Lock, AlertTriangle, User, Lightbulb, CheckCircle } from 'lucide-react';
import { BookOpenIcon } from '@/components/icons/BookOpenIcon';
import { StudentVerificationInput } from "@/components/auth/StudentVerificationInput";
import { PasswordStrengthChecker } from "@/components/auth/PasswordStrengthChecker";
import { isValidEmailForRegistration, getEmailType, DEV_MODE } from '@/config/devMode';
import { UsernameValidator } from "@/utils/auth/usernameValidator";
import { useRecaptchaVerification } from '@/contexts/RecaptchaContext';

// 檢查郵件是否為有效的學生郵件（保留以兼容性）
const isValidStudentEmail = (email: string): boolean => {
  const emailLower = email.toLowerCase();
  // 使用正則表達式確保完全匹配，防止像 abc@ln.edsf.hk 這樣的郵件通過
  const validEmailPattern = /^[a-zA-Z0-9._%+-]+@(ln\.hk|ln\.edu\.hk)$/;
  return validEmailPattern.test(emailLower);
};

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isStudentVerified, setIsStudentVerified] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuggestion, setUsernameSuggestion] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const { t } = useLanguage();
  const { verifyRecaptcha, isRecaptchaLoaded } = useRecaptchaVerification();
  const { 
    register, 
    sendStudentVerificationCode, 
    verifyStudentCode, 
    getVerificationRemainingTime 
  } = useAuth();
  const navigate = useNavigate();

  // 當郵箱改變時生成用戶名建議
  useEffect(() => {
    if (email && !username) {
      const suggestion = UsernameValidator.generateSuggestion(email);
      setUsernameSuggestion(suggestion);
    }
  }, [email, username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!termsAccepted) {
      setError(t('auth.mustAgreeTerms'));
      return;
    }
    
    if (!isStudentVerified) {
      setError(t('auth.pleaseVerifyStudentEmail'));
      return;
    }

    if (!isUsernameValid) {
      setError(t('auth.validUsername'));
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

    setLoading(true);
    setError('');

    try {
      // 執行 reCAPTCHA 驗證
      const recaptchaResult = await verifyRecaptcha('register');
      if (!recaptchaResult.success) {
        setError(recaptchaResult.error || t('auth.captchaFailed'));
        setLoading(false);
        return;
      }

      // 創建帳戶並登入，使用用戶名作為 name
      // 將 reCAPTCHA token 傳遞給註冊函數
      await register(email, password, username, recaptchaResult.token);
      
      // 重定向到首頁
      navigate('/');
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === 409) {
        setError(t('auth.emailAlreadyExists'));
      } else if (error?.message?.includes('Password must be between 8 and 256 characters') || 
                 error?.message?.includes('Invalid `password` param: Password must be between 8 and 256 characters long')) {
        // 在開發模式下跳過密碼長度錯誤，因為後端會自動使用預設密碼
        if (!DEV_MODE.enabled || !DEV_MODE.bypassPassword) {
          setError(t('auth.passwordTooShort'));
        }
      } else if (error?.message?.includes('Rate limit') || 
                 error?.message?.includes('Too many requests') ||
                 error?.message?.includes('Rate limit for the current endpoint has been exceeded')) {
        setError(t('auth.rateLimitExceeded'));
      } else {
        setError(t('auth.registrationFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value.toLowerCase();
    setEmail(newEmail);
    setIsStudentVerified(false);
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

  // 開發模式下的自動驗證效果
  useEffect(() => {
    if (DEV_MODE.enabled && DEV_MODE.bypassPassword && password) {
      console.log('🔧 開發模式：自動設置密碼為有效');
      setIsPasswordValid(true);
    }
  }, [password]);

  // 開發模式下的用戶名自動驗證
  useEffect(() => {
    if (DEV_MODE.enabled && username && username.length >= 3) {
      console.log('🔧 開發模式：自動設置用戶名為有效');
      setIsUsernameValid(true);
      setUsernameError('');
    }
  }, [username]);

  return (
    <div className="h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="w-full max-w-md flex flex-col max-h-full">
        {/* Logo and Title */}
        <div className="text-center mb-4 flex-shrink-0">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
            <BookOpenIcon className="h-8 w-8" />
            LingUBible
          </Link>
          <p className="text-muted-foreground mt-2">{t('auth.createStudentAccount')}</p>
        </div>

        <Card className="glass-card flex flex-col flex-1 min-h-0">
          <CardHeader className="text-center flex-shrink-0">
            <CardTitle className="text-2xl">{t('auth.signUp')}</CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 簡化的單列佈局 */}
              <div className="space-y-6">
                {/* 郵箱驗證區域 */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('auth.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder={t('auth.emailPlaceholder')}
                      autoComplete="email"
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  {/* 嶺南人驗證 */}
                  {email && (
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
                  {isStudentVerified && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {t('auth.studentVerificationSuccess')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 用戶名區域 */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">{t('auth.username')}</Label>
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
                  

                </div>

                {/* 密碼區域 */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    <PasswordInput
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.enterPassword')}
                      autoComplete="new-password"
                      required
                      disabled={loading}
                    />
                  </div>

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

                  {/* 密碼強度檢查器 */}
                  {password && (
                    <PasswordStrengthChecker
                      password={password}
                      email={email}
                      onValidationChange={handlePasswordValidationChange}
                    />
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

              {/* Terms Agreement Checkbox */}
              <div className="flex items-center justify-center space-x-2">
                <Checkbox
                  id="termsAccepted"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                />
                <Label 
                  htmlFor="termsAccepted" 
                  className="text-sm font-normal cursor-pointer"
                >
                  {t('auth.termsCheckbox')}{' '}
                  <Link to="/terms" className="text-primary hover:underline">
                    {t('auth.termsOfService')}
                  </Link>{' '}
                  {t('auth.and')}{' '}
                  <Link to="/privacy" className="text-primary hover:underline">
                    {t('auth.privacyPolicy')}
                  </Link>
                </Label>
              </div>



              <div className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !isStudentVerified || !isUsernameValid || !isPasswordValid || !termsAccepted}
                >
                  {loading ? t('auth.processing') : t('auth.signUp')}
                </Button>
                
                <p className="text-center text-sm text-muted-foreground">
                  {t('auth.haveAccount')}{' '}
                  <Link to="/login" className="text-primary hover:underline">
                    {t('auth.signIn')}
                  </Link>
                </p>

                <div className="text-center">
                  <Link 
                    to="/" 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    ← {t('auth.backToHome')}
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 安全連接頁腳 */}
        <div className="mt-8 text-center">
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