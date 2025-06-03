import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { StudentVerificationInput } from './StudentVerificationInput';
import { PasswordStrengthChecker } from './PasswordStrengthChecker';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isStudentVerified, setIsStudentVerified] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isSignUp) {
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
        onClose();
      } else {
        await login(email, password);
        onClose();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // 處理不同類型的錯誤
      if (err?.message?.includes('請先驗證您的學生郵件地址')) {
        setError('請先驗證您的學生郵件地址');
      } else if (err?.message?.includes('Invalid credentials')) {
        setError('郵件地址或密碼錯誤');
      } else if (err?.message?.includes('user with the same email already exists')) {
        setError('此郵件地址已被註冊');
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
    setPassword('');
    setConfirmPassword('');
    setIsStudentVerified(false);
    setIsPasswordValid(false);
    onClose();
  };

  const handleModeSwitch = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setIsStudentVerified(false);
    setPassword('');
    setConfirmPassword('');
    setIsPasswordValid(false);
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
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
                setEmail(e.target.value);
                setIsStudentVerified(false); // 重置驗證狀態當郵件改變時
              }}
              placeholder={isSignUp ? "student@ln.edu.hk 或 student@ln.hk" : t('auth.enterEmail')}
              required
              disabled={loading}
            />
          </div>
          
          {/* 註冊時顯示學生驗證 */}
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
                  學生郵件驗證成功！現在可以設定密碼完成註冊
                </p>
              </div>
            </div>
          )}
          
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
                  密碼確認不匹配
                </p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  密碼確認匹配
                </p>
              )}
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full gradient-primary hover:opacity-90 text-white"
            disabled={loading || (isSignUp && (!isStudentVerified || !isPasswordValid || password !== confirmPassword))}
          >
            {loading ? '處理中...' : (isSignUp ? t('auth.signUp') : t('auth.signIn'))}
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
