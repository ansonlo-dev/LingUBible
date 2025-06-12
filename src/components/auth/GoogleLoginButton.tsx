import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { oauthService } from '@/services/api/oauth';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { GoogleIcon } from '@/components/icons/GoogleIcon';

interface GoogleLoginButtonProps {
  disabled?: boolean;
}

export function GoogleLoginButton({ disabled = false }: GoogleLoginButtonProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      
      // 顯示更清楚的警告提示
      toast({
        variant: "default",
        title: "ℹ️ " + t('oauth.loginRequirement'),
        description: t('oauth.loginRequirementDescription'),
        duration: 5000,
      });
      
      await oauthService.loginWithGoogle();
      // 重定向會在 oauthService.loginWithGoogle() 中處理
    } catch (error: any) {
      console.error('Google 登入失敗:', error);
      toast({
        variant: "destructive",
        title: t('oauth.loginFailed'),
        description: error.message || t('oauth.loginError'),
        duration: 5000,
      });
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGoogleLogin}
      disabled={disabled || loading}
      className="w-full transition-all duration-200 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30 group"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {t('oauth.signingIn')}
        </>
      ) : (
        <>
          <GoogleIcon size={16} className="mr-2 transition-transform duration-200 group-hover:scale-110" />
          <span className="transition-colors duration-200 group-hover:text-blue-700 dark:group-hover:text-blue-300">
            {t('oauth.continueWithGoogle')}
          </span>
        </>
      )}
    </Button>
  );
} 