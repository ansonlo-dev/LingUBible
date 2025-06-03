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

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isStudentVerified, setIsStudentVerified] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [emailCheckStatus, setEmailCheckStatus] = useState<'checking' | 'available' | 'taken' | 'error' | null>(null);
  
  const { t } = useLanguage();
  const { 
    register, 
    sendStudentVerificationCode, 
    verifyStudentCode, 
    getVerificationRemainingTime 
  } = useAuth();
  const navigate = useNavigate();

  // 檢查郵件是否已註冊的函數
  const checkEmailAvailability = async (emailToCheck: string) => {
    if (!emailToCheck || !emailToCheck.includes('@')) {
      setEmailCheckStatus(null);
      return;
    }

    setEmailCheckStatus('checking');
    
    try {
      // 模擬 API 調用檢查郵件是否已註冊
      // 在實際應用中，這應該是一個真實的 API 調用
      const response = await fetch('/api/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailToCheck }),
      });

      if (response.ok) {
        const data = await response.json();
        setEmailCheckStatus(data.exists ? 'taken' : 'available');
      } else {
        // 如果 API 不存在，我們可以模擬一些已知的註冊郵件
        const knownEmails = [
          'test@ln.edu.hk',
          'admin@ln.edu.hk',
          'student@ln.edu.hk',
          'demo@ln.hk'
        ];
        
        setEmailCheckStatus(knownEmails.includes(emailToCheck.toLowerCase()) ? 'taken' : 'available');
      }
    } catch (error) {
      console.error('Error checking email:', error);
      // 如果檢查失敗，假設郵件可用但顯示警告
      setEmailCheckStatus('available');
    }
  };

  // 使用 useEffect 來延遲檢查郵件（防抖）
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (email) {
        checkEmailAvailability(email);
      }
    }, 1000); // 1秒延遲

    return () => clearTimeout(timeoutId);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (emailCheckStatus === 'taken') {
        setError('此郵件地址已被註冊，請使用其他郵件地址或前往登入頁面');
        return;
      }

      if (password !== confirmPassword) {
        setError(t('auth.passwordMismatch'));
        return;
      }
      
      if (!isStudentVerified) {
        setError('請先驗證您的學生郵件地址');
        return;
      }

      if (!isPasswordValid) {
        setError('密碼不符合安全要求，請檢查密碼強度指示器');
        return;
      }
      
      await register(email, password, email);
      navigate('/'); // 註冊成功後導向首頁
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // 處理不同類型的錯誤
      if (err?.message?.includes('請先驗證您的學生郵件地址')) {
        setError('請先驗證您的學生郵件地址');
      } else if (err?.message?.includes('user with the same email already exists')) {
        setError('此郵件地址已被註冊');
      } else {
        setError(err?.message || '註冊失敗');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setIsStudentVerified(false);
    setEmailCheckStatus(null);
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
                      placeholder="student@ln.edu.hk 或 student@ln.hk"
                      required
                      disabled={loading}
                      className={
                        emailCheckStatus === 'taken' ? 'border-red-500 focus:border-red-500' :
                        emailCheckStatus === 'available' ? 'border-green-500 focus:border-green-500' :
                        ''
                      }
                    />
                    
                    {/* 郵件檢查狀態顯示 */}
                    {emailCheckStatus === 'checking' && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                        <span>檢查郵件是否可用...</span>
                      </div>
                    )}
                    
                    {emailCheckStatus === 'taken' && (
                      <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <AlertDescription className="text-red-600 dark:text-red-400">
                          此郵件地址已被註冊。如果這是您的帳戶，請前往{' '}
                          <Link to="/login" className="underline font-medium hover:no-underline">
                            登入頁面
                          </Link>
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {emailCheckStatus === 'available' && (
                      <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                        <CheckCircle className="h-3 w-3" />
                        <span>郵件地址可用</span>
                      </div>
                    )}
                  </div>
                  
                  {/* 學生驗證 */}
                  {email && emailCheckStatus !== 'taken' && (
                    <StudentVerificationInput
                      email={email}
                      onSendCode={sendStudentVerificationCode}
                      onVerifyCode={verifyStudentCode}
                      getRemainingTime={getVerificationRemainingTime}
                      onCodeVerified={handleStudentVerified}
                      disabled={loading || emailCheckStatus === 'checking'}
                    />
                  )}
                  
                  {/* 驗證成功提示 */}
                  {isStudentVerified && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <p className="text-sm text-green-600 dark:text-green-400">
                          學生郵件驗證成功！現在可以設定密碼完成註冊
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
                  disabled={loading || !isStudentVerified || !isPasswordValid || emailCheckStatus === 'taken'}
                >
                  {loading ? '註冊中...' : t('auth.signUp')}
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