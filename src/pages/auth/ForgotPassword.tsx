import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Mail, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
import { BookOpenIcon } from '@/components/icons/BookOpenIcon';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/contexts/AuthContext';
import { useRecaptcha } from '@/contexts/RecaptchaContext';
import { useForgotPasswordRecaptcha } from '@/hooks/useSmartRecaptcha';

// 檢查郵件是否為有效的學生郵件
const isValidStudentEmail = (email: string): boolean => {
  const emailLower = email.toLowerCase();
  // 使用正則表達式確保完全匹配，防止像 abc@ln.edsf.hk 這樣的郵件通過
  const validEmailPattern = /^[a-zA-Z0-9._%+-]+@(ln\.hk|ln\.edu\.hk)$/;
  return validEmailPattern.test(emailLower);
};

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');
  const { t, language } = useLanguage();
  const { sendPasswordReset } = useAuth();
  const { isRecaptchaLoaded } = useRecaptcha();
  const { verifyForgotPassword } = useForgotPasswordRecaptcha();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 檢查是否為有效的學生郵件
      if (!isValidStudentEmail(email)) {
        setError(t('auth.useSchoolEmail'));
        return;
      }

      // 執行 reCAPTCHA 驗證
      const recaptchaResult = await verifyForgotPassword({
        onError: (error) => {
          setError(error);
        }
      });
      if (!recaptchaResult.success) {
        return;
      }

      // 發送密碼重設郵件
      const result = await sendPasswordReset(email, recaptchaResult.token, language);
      
      if (result.success) {
        setIsEmailSent(true);
      } else {
        setError(result.message || t('auth.sendResetFailed'));
      }
    } catch (err: any) {
      setError(err.message || t('auth.sendResetFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value.toLowerCase();
    setEmail(newEmail);
    setError('');
  };

  if (isEmailSent) {
    return (
      <div className="h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
        <div className="w-full max-w-[32rem] flex flex-col max-h-full">
          {/* Logo and Title */}
          <div className="text-center mb-4 flex-shrink-0">
            <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
              <BookOpenIcon className="h-8 w-8" />
              LingUBible
            </Link>
            <p className="text-muted-foreground mt-2">{t('auth.checkYourEmail')}</p>
          </div>

          <Card className="glass-card flex flex-col flex-1 min-h-0">
            <CardHeader className="text-center flex-shrink-0">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">{t('auth.emailSent')}</CardTitle>
              <CardDescription>
                {t('auth.resetLinkSent')} {email} {t('auth.resetLinkSentComplete')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 overflow-y-auto">
              <div className="text-center text-sm text-muted-foreground">
                <p>{t('auth.checkEmailInbox')}</p>
                <p className="font-medium text-foreground">{email}</p>
              </div>
              
              <div className="text-xs text-muted-foreground text-center mt-4 space-y-1">
                <p>• {t('auth.resetLinkWillExpire')}</p>
                <p>• {t('auth.checkSpamFolder')}</p>
                <p>• {t('auth.canRetryReset')}</p>
              </div>

              <div className="flex flex-col space-y-2">
                <Button
                  onClick={() => {
                    setIsEmailSent(false);
                    setEmail('');
                  }}
                  variant="outline"
                  className="w-full"
                >
                  {t('auth.resendReset')}
                </Button>
                
                <Button asChild variant="ghost" className="w-full">
                  <Link to="/login" className="flex items-center justify-center">
                    <ArrowLeft className="mr-2 h-4 w-4" />
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

  return (
    <div className="h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="w-full max-w-[32rem] flex flex-col max-h-full">
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
              <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl">{t('auth.resetPassword')}</CardTitle>
            <CardDescription>
              {t('auth.resetPasswordDescription')}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4 forgot-password-form">
              {/* Email field with responsive layout */}
              <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                <Label htmlFor="email" className="md:w-32 md:flex-shrink-0 md:text-right">{t('auth.studentEmailAddress')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder={t('auth.schoolEmailPlaceholder')}
                  autoComplete="email"
                  required
                  disabled={isLoading}
                  className="md:flex-1"
                />
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <AlertDescription className="text-red-600 dark:text-red-400">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-xs text-muted-foreground text-center mt-4">
                <p>• {t('auth.useSchoolEmail')}</p>
                <p>• {t('auth.resetLinkWillExpire')}</p>
              </div>



              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('auth.sending') : t('auth.sendResetLink')}
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