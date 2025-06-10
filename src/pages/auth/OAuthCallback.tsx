import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { t } = useLanguage();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 檢查 URL 參數中是否有錯誤
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          console.error('OAuth 錯誤:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || error);
          
          toast({
            variant: "destructive",
            title: t('oauth.linkFailed'),
            description: t('oauth.authorizationDenied'),
            duration: 5000,
          });
          
          // 3秒後重定向到設置頁面
          setTimeout(() => {
            navigate('/user/settings');
          }, 3000);
          return;
        }

        // 檢查是否有授權碼或其他成功指標
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        if (code) {
          // OAuth 授權成功，刷新用戶資料
          await refreshUser();
          
          setStatus('success');
          setMessage(t('oauth.linkSuccess'));
          
          toast({
            variant: "success",
            title: t('oauth.linkSuccess'),
            description: t('oauth.googleAccountLinked'),
            duration: 5000,
          });
          
          // 2秒後重定向到設置頁面
          setTimeout(() => {
            navigate('/user/settings');
          }, 2000);
        } else {
          // 沒有找到預期的參數
          setStatus('error');
          setMessage(t('oauth.invalidCallback'));
          
          setTimeout(() => {
            navigate('/user/settings');
          }, 3000);
        }
      } catch (error: any) {
        console.error('處理 OAuth 回調失敗:', error);
        setStatus('error');
        setMessage(error.message || t('oauth.callbackError'));
        
        toast({
          variant: "destructive",
          title: t('oauth.linkFailed'),
          description: error.message || t('oauth.callbackError'),
          duration: 5000,
        });
        
        setTimeout(() => {
          navigate('/user/settings');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, refreshUser, t]);

  const handleReturnToSettings = () => {
    navigate('/user/settings');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('oauth.processing')}
              </>
            )}
            {status === 'success' && (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                {t('oauth.success')}
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                {t('oauth.failed')}
              </>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {status === 'loading' && t('oauth.processingDescription')}
            {status === 'success' && t('oauth.successDescription')}
            {status === 'error' && message}
          </p>
          
          {status === 'loading' && (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          {status !== 'loading' && (
            <Button onClick={handleReturnToSettings} className="w-full">
              {t('oauth.returnToSettings')}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 