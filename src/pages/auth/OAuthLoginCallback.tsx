import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OAuthLoginCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { t } = useLanguage();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleLoginCallback = async () => {
      try {
        // 檢查 URL 參數中是否有錯誤
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          console.error('OAuth 登入錯誤:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || error);
          
          // 3秒後重定向到登入頁面
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          return;
        }

        // 對於 createOAuth2Session，Appwrite 會自動處理會話創建
        // 我們只需要等待一下讓處理完成，然後刷新用戶資料
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          // 刷新用戶資料以確認登入成功
          await refreshUser();
          
          setStatus('success');
          setMessage(t('oauth.loginSuccess'));
          
          // 顯示登入成功 toast
          toast({
            variant: "success",
            title: t('oauth.loginSuccess'),
            description: t('oauth.welcomeBack'),
            duration: 3000,
          });
          
          // 2秒後重定向到首頁
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } catch (refreshError) {
          console.error('刷新用戶資料失敗:', refreshError);
          setStatus('error');
          setMessage(t('oauth.loginFailed'));
          
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } catch (error: any) {
        console.error('處理 OAuth 登入回調失敗:', error);
        setStatus('error');
        setMessage(error.message || t('oauth.callbackError'));
        
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleLoginCallback();
  }, [searchParams, navigate, refreshUser, t]);

  const handleReturnToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('oauth.processingLogin')}
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                {t('oauth.loginSuccess')}
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                {t('oauth.loginFailed')}
              </>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {status === 'loading' && t('oauth.processingLoginDescription')}
            {status === 'success' && t('oauth.redirectingToHome')}
            {status === 'error' && message}
          </p>
          
          {status === 'loading' && (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          {status === 'error' && (
            <Button onClick={handleReturnToLogin} className="w-full">
              {t('oauth.returnToLogin')}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 