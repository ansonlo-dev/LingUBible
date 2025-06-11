import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { oauthService } from '@/services/api/oauth';
import { toast } from '@/components/ui/use-toast';
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
      className="w-full"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {t('oauth.signingIn')}
        </>
      ) : (
        <>
          <GoogleIcon size={16} className="mr-2" />
          {t('oauth.continueWithGoogle')}
        </>
      )}
    </Button>
  );
} 