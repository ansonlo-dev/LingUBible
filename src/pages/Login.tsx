import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Lock, AlertTriangle, UserPlus } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailCheckStatus, setEmailCheckStatus] = useState<'checking' | 'exists' | 'not-found' | null>(null);
  
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();

  // 檢查郵件是否已註冊的函數
  const checkEmailExists = async (emailToCheck: string) => {
    if (!emailToCheck || !emailToCheck.includes('@')) {
      setEmailCheckStatus(null);
      return;
    }

    setEmailCheckStatus('checking');
    
    try {
      // 模擬 API 調用檢查郵件是否已註冊
      const response = await fetch('/api/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailToCheck }),
      });

      if (response.ok) {
        const data = await response.json();
        setEmailCheckStatus(data.exists ? 'exists' : 'not-found');
      } else {
        // 如果 API 不存在，我們可以模擬一些已知的註冊郵件
        const knownEmails = [
          'test@ln.edu.hk',
          'admin@ln.edu.hk',
          'student@ln.edu.hk',
          'demo@ln.hk'
        ];
        
        setEmailCheckStatus(knownEmails.includes(emailToCheck.toLowerCase()) ? 'exists' : 'not-found');
      }
    } catch (error) {
      console.error('Error checking email:', error);
      // 如果檢查失敗，不顯示任何狀態
      setEmailCheckStatus(null);
    }
  };

  // 使用 useEffect 來延遲檢查郵件（防抖）
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (email) {
        checkEmailExists(email);
      }
    }, 1000); // 1秒延遲

    return () => clearTimeout(timeoutId);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (emailCheckStatus === 'not-found') {
        setError('此郵件地址尚未註冊，請先註冊帳戶');
        return;
      }

      await login(email, password, rememberMe);
      
      navigate('/'); // 登入成功後導向首頁
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // 處理不同類型的錯誤
      if (err?.message?.includes('Invalid credentials')) {
        setError('郵件地址或密碼錯誤');
      } else if (err?.message?.includes('User not found')) {
        setError('此郵件地址尚未註冊');
      } else {
        setError(err?.message || '登入失敗');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setEmailCheckStatus(null);
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
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
            <BookOpen className="h-8 w-8" />
            LingUBible
          </Link>
          <p className="text-muted-foreground mt-2">{t('auth.welcomeBack')}</p>
        </div>

        <Card className="glass-card">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t('auth.signIn')}</CardTitle>
            <CardDescription>
              {t('auth.enterAccountInfo')}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder={t('auth.enterEmail')}
                  required
                  disabled={loading}
                  className={
                    emailCheckStatus === 'not-found' ? 'border-orange-500 focus:border-orange-500' :
                    emailCheckStatus === 'exists' ? 'border-green-500 focus:border-green-500' :
                    ''
                  }
                />
                
                {/* 郵件檢查狀態顯示 */}
                {emailCheckStatus === 'checking' && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                    <span>檢查帳戶...</span>
                  </div>
                )}
                
                {emailCheckStatus === 'not-found' && (
                  <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
                    <UserPlus className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <AlertDescription className="text-orange-600 dark:text-orange-400">
                      此郵件地址尚未註冊。{' '}
                      <Link to="/register" className="underline font-medium hover:no-underline">
                        立即註冊
                      </Link>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              
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
                disabled={loading || emailCheckStatus === 'not-found'}
              >
                {loading ? '登入中...' : t('auth.signIn')}
              </Button>
              
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