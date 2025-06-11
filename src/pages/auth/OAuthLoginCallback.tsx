import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { account } from '@/lib/appwrite';

export default function OAuthLoginCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { t } = useLanguage();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const toastShownRef = useRef(false); // 防止重複顯示 toast

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

        // 檢查是否有從 OAuthCallback 重定向過來的參數
        const userId = searchParams.get('userId');
        const secret = searchParams.get('secret');
        
        if (userId && secret) {
          // 處理從帳戶連結回調重定向過來的登入
          try {
            console.log('處理從帳戶連結重定向的登入...');
            await account.createSession(userId, secret);
            await refreshUser();
            
            setStatus('success');
            setMessage(t('oauth.loginSuccess'));
            
            // 顯示登入成功 toast（這是從帳戶連結重定向的登入）
            if (!toastShownRef.current) {
              toastShownRef.current = true;
              toast({
                variant: "success",
                title: t('oauth.loginSuccess'),
                description: t('oauth.welcomeBack'),
                duration: 3000,
              });
            }
            
            // 2秒後重定向到首頁
            setTimeout(() => {
              navigate('/');
            }, 2000);
            return;
          } catch (sessionError: any) {
            console.error('創建會話失敗:', sessionError);
            setStatus('error');
            setMessage(t('oauth.loginFailed'));
            
            setTimeout(() => {
              navigate('/login');
            }, 3000);
            return;
          }
        }

        // 對於 createOAuth2Session，我們需要檢查是否有會話被創建
        // 如果有會話，說明是登入操作；如果沒有會話但有錯誤，可能是郵箱驗證失敗
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          // 嘗試獲取當前會話
          let currentUser;
          try {
            currentUser = await account.get();
            console.log('OAuth 登入成功，用戶:', currentUser.email);
          } catch (sessionError) {
            // 沒有有效會話，檢查是否是因為郵箱驗證失敗
            console.log('沒有有效會話，可能是郵箱驗證失敗');
            
            // 檢查 URL 中是否有特殊的錯誤參數（Appwrite 可能會添加）
            const urlParams = new URLSearchParams(window.location.search);
            const hasOAuthParams = urlParams.has('code') || urlParams.has('state');
            
            if (hasOAuthParams) {
              // 有 OAuth 參數但沒有會話，說明 OAuth 流程被中斷
              // 這可能是因為郵箱不符合要求
              setStatus('error');
              setMessage(t('oauth.studentEmailRequired'));
              
              if (!toastShownRef.current) {
                toastShownRef.current = true;
                toast({
                  variant: "destructive",
                  title: t('oauth.loginFailed'),
                  description: t('oauth.studentEmailRequired'),
                  duration: 5000,
                });
              }
              
              setTimeout(() => {
                navigate('/login');
              }, 3000);
              return;
            }
            
            // 沒有 OAuth 參數，可能是其他錯誤
            throw sessionError;
          }
          
          // 如果到這裡，說明會話創建成功，檢查郵箱
          const email = currentUser.email;
          const isStudentEmail = email && (email.endsWith('@ln.hk') || email.endsWith('@ln.edu.hk'));
          
          if (!isStudentEmail) {
            // 如果不是學生郵箱，這是一個嚴重的安全問題
            // 我們需要立即刪除用戶帳戶（不只是會話）
            console.error('非學生郵箱成功創建帳戶，這是安全漏洞:', email);
            
            try {
              // 首先嘗試刪除當前會話
              await account.deleteSession('current');
              
              // 調用後端清理函數來刪除用戶帳戶
              try {
                const response = await fetch('/api/functions/cleanup-expired-codes/executions', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    action: 'immediate_cleanup',
                    userId: currentUser.$id,
                    email: email,
                    reason: 'non_student_email'
                  })
                });
                
                if (response.ok) {
                  const result = await response.json();
                  console.log('後端清理函數調用成功:', result);
                } else {
                  console.error('後端清理函數調用失敗:', response.status);
                }
              } catch (cleanupError) {
                console.error('調用後端清理函數失敗:', cleanupError);
              }
              
              console.error('安全警告：非學生郵箱帳戶已創建但被阻止登入:', email);
              
            } catch (deleteError) {
              console.error('刪除會話失敗:', deleteError);
            }
            
            setStatus('error');
            setMessage(t('oauth.studentEmailRequired'));
            
            if (!toastShownRef.current) {
              toastShownRef.current = true;
              toast({
                variant: "destructive",
                title: t('oauth.loginFailed'),
                description: t('oauth.studentEmailRequired'),
                duration: 5000,
              });
            }
            
            setTimeout(() => {
              navigate('/login');
            }, 3000);
            return;
          }
          
          // 郵箱驗證通過，刷新用戶資料
          await refreshUser();
          
          setStatus('success');
          setMessage(t('oauth.loginSuccess'));
          
          // 顯示登入成功 toast
          if (!toastShownRef.current) {
            toastShownRef.current = true;
            toast({
              variant: "success",
              title: t('oauth.loginSuccess'),
              description: t('oauth.welcomeBack'),
              duration: 3000,
            });
          }
          
          // 2秒後重定向到首頁
          setTimeout(() => {
            navigate('/');
          }, 2000);
          
        } catch (refreshError) {
          console.error('處理 OAuth 登入失敗:', refreshError);
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