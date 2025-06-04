import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, CheckCircle, Lock, AlertTriangle, Info } from 'lucide-react';
import { StudentVerificationInput } from '@/components/StudentVerificationInput';
import { PasswordStrengthChecker } from '@/components/PasswordStrengthChecker';

// 檢查郵件是否為有效的學生郵件
const isValidStudentEmail = (email: string): boolean => {
  const emailLower = email.toLowerCase();
  // 使用正則表達式確保完全匹配，防止像 abc@ln.edsf.hk 這樣的郵件通過
  const validEmailPattern = /^[a-zA-Z0-9._%+-]+@(ln\.edu\.hk|ln\.hk)$/;
  return validEmailPattern.test(emailLower);
};

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isStudentVerified, setIsStudentVerified] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  
  const { t } = useLanguage();
  const { 
    register, 
    sendStudentVerificationCode, 
    verifyStudentCode, 
    getVerificationRemainingTime 
  } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (password !== confirmPassword) {
        setError(t('auth.passwordMismatch'));
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
      
      await register(email, password, email);
      navigate('/'); // 註冊成功後導向首頁
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // 使用通用的錯誤訊息，不透露郵件是否已存在
      if (err?.message?.includes('請先驗證您的學生郵件地址')) {
        setError(t('auth.pleaseVerifyStudentEmail'));
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

  const handleStudentVerified = () => {
    setIsStudentVerified(true);
    setError('');
  };

  const handlePasswordValidationChange = (isValid: boolean) => {
    setIsPasswordValid(isValid);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Logo and Title */}
        <div className="text-center mb-8 pt-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
            <BookOpen className="h-8 w-8" />
            LingUBible
          </Link>
          <p className="text-muted-foreground mt-2">{t('auth.createStudentAccount')}</p>
        </div>

        <Card className="glass-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('auth.signUp')}</CardTitle>
            <CardDescription>
              {t('auth.fillInfoToCreate')}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 兩列佈局 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 左列：基本資訊和驗證 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('auth.studentInfoVerification')}
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('auth.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder={t('auth.emailPlaceholder')}
                      required
                      disabled={loading}
                    />
                  </div>
                  
                  {/* 學生驗證 */}
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

                {/* 右列：密碼設定 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('auth.passwordSetup')}
                  </h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('auth.enterPassword')}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={t('auth.confirmPasswordPlaceholder')}
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

                  {/* 學校帳戶密碼提醒 */}
                  <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-600 dark:text-blue-400">
                      {t('auth.schoolPasswordReminder')}
                    </AlertDescription>
                  </Alert>
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

              <div className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !isStudentVerified || !isPasswordValid}
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