import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { account } from '@/lib/appwrite';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
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

        // 檢查是否有 createOAuth2Token 返回的參數
        const userId = searchParams.get('userId');
        const secret = searchParams.get('secret');
        
        if (userId && secret) {
          try {
            // 檢查用戶是否已經登入
            if (user) {
              // 用戶已登入，這是帳戶連結操作
              // 對於帳戶連結，我們不需要創建新會話
              // 只需要等待一下讓 Appwrite 處理連結，然後刷新用戶資料
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // 刷新用戶資料以獲取最新的身份提供者信息
              await refreshUser();
            } else {
              // 用戶未登入，這可能是登入操作，創建會話
              await account.createSession(userId, secret);
              await refreshUser();
            }
            
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
          } catch (sessionError: any) {
            console.error('處理會話失敗:', sessionError);
            
            // 如果是帳戶連結操作，即使創建會話失敗也可能連結成功了
            if (user) {
              // 嘗試刷新用戶資料看看連結是否成功
              try {
                await refreshUser();
                setStatus('success');
                setMessage(t('oauth.linkSuccess'));
                
                toast({
                  variant: "success",
                  title: t('oauth.linkSuccess'),
                  description: t('oauth.googleAccountLinked'),
                  duration: 5000,
                });
                
                setTimeout(() => {
                  navigate('/user/settings');
                }, 2000);
                return;
              } catch (refreshError) {
                console.error('刷新用戶資料失敗:', refreshError);
              }
            }
            
            setStatus('error');
            setMessage(t('oauth.sessionCreationFailed'));
            
            toast({
              variant: "destructive",
              title: t('oauth.linkFailed'),
              description: t('oauth.sessionCreationFailed'),
              duration: 5000,
            });
            
            setTimeout(() => {
              navigate('/user/settings');
            }, 3000);
          }
        } else {
          // 沒有找到預期的參數
          setStatus('error');
          setMessage(t('oauth.invalidCallback'));
          
          toast({
            variant: "destructive",
            title: t('oauth.linkFailed'),
            description: t('oauth.invalidCallback'),
            duration: 5000,
          });
          
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
  }, [searchParams, navigate, user, refreshUser, t]);

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