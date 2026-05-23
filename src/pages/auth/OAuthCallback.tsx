import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { account } from '@/lib/appwrite';
import { oauthService } from '@/services/api/oauth';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [needRelogin, setNeedRelogin] = useState(false);
  const toastShownRef = useRef(false); // 防止重複顯示 toast

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('開始處理 OAuth 回調，當前用戶狀態:', user?.email || '未登入');
        
        // 檢查 URL 參數中是否有錯誤
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          console.error('OAuth 錯誤:', error, errorDescription);
          
          // 智能錯誤檢測和處理
          let errorMessage = errorDescription || error;
          let errorTitle = t('oauth.linkFailed');
          
          // 檢查是否是帳戶已存在的錯誤
          if (error.includes('user_already_exists') || 
              errorDescription?.includes('user_already_exists') ||
              errorDescription?.includes('already exists') ||
              error === 'access_denied') {
            errorMessage = t('oauth.accountAlreadyLinkedToAnother');
            errorTitle = t('oauth.accountAlreadyLinked');
          } else if (error === 'access_denied') {
            errorMessage = t('oauth.authorizationDenied');
          }
          
          setStatus('error');
          setMessage(errorMessage);
          
          if (!toastShownRef.current) {
            toastShownRef.current = true;
            toast({
              variant: "destructive",
              title: errorTitle,
              description: errorMessage,
              duration: 5000,
            });
          }
          
          // 3秒後重定向到設置頁面
          setTimeout(() => {
            navigate('/settings');
          }, 3000);
          return;
        }

        // 檢查是否有 OAuth 成功的跡象
        const urlParams = new URLSearchParams(window.location.search);
        const hasOAuthParams = urlParams.has('code') || urlParams.has('state') || 
                              searchParams.get('userId') || searchParams.get('secret');
        
        console.log('OAuth 參數檢查:', {
          hasCode: urlParams.has('code'),
          hasState: urlParams.has('state'),
          hasUserId: !!searchParams.get('userId'),
          hasSecret: !!searchParams.get('secret'),
          allParams: Object.fromEntries(urlParams.entries())
        });
        
        if (!hasOAuthParams) {
          // 沒有 OAuth 參數，可能是直接訪問這個頁面
          setStatus('error');
          setMessage(t('oauth.invalidCallback'));
          
          if (!toastShownRef.current) {
            toastShownRef.current = true;
            toast({
              variant: "destructive",
              title: t('oauth.linkFailed'),
              description: t('oauth.invalidCallback'),
              duration: 5000,
            });
          }
          
          setTimeout(() => {
            navigate('/settings');
          }, 3000);
          return;
        }

        // 等待一下讓 Appwrite 處理 OAuth 連結
        console.log('等待 Appwrite 處理 OAuth 連結...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 檢查當前路徑，確定這是帳戶連結操作
        const isAccountLinkingCallback = window.location.pathname === '/oauth/callback';
        
        if (isAccountLinkingCallback) {
          console.log('這是帳戶連結回調');
          
          // 首先嘗試檢查用戶登入狀態
          let currentUser;
          try {
            currentUser = await account.get();
            console.log('當前用戶:', currentUser?.email);
          } catch (userError) {
            console.log('無法獲取當前用戶，可能未登入');
            currentUser = null;
          }
          
          if (!currentUser) {
            // 用戶未登入，但這是帳戶連結回調
            // 嘗試刷新用戶狀態，看看 OAuth 是否已經創建了會話
            console.log('用戶未登入，嘗試刷新用戶狀態...');
            
            try {
              // 先嘗試直接獲取用戶，而不是刷新
              currentUser = await account.get();
              console.log('直接獲取用戶成功:', currentUser?.email);
              
              if (currentUser) {
                // 現在嘗試刷新用戶狀態
                try {
                  await refreshUser();
                  console.log('刷新用戶狀態成功');
                } catch (refreshError) {
                  console.warn('刷新用戶狀態失敗，但用戶已存在:', refreshError);
                  // 即使刷新失敗，如果用戶存在就繼續
                }
                
                // 用戶現在已登入，這是成功的「連結並登入」操作
                console.log('OAuth 連結並登入成功');
                setStatus('success');
                setMessage(t('oauth.linkSuccess'));
                
                localStorage.setItem('googleLinkSuccess', 'true');
                localStorage.setItem('needSessionRefresh', 'true');
                
                // 設置 OAuth 特定的會話標記，防止被自動登出
                sessionStorage.setItem('oauthSession', 'true');
                
                if (!toastShownRef.current) {
                  toastShownRef.current = true;
                  toast({
                    variant: "success",
                    title: t('oauth.linkSuccess'),
                    description: t('oauth.googleAccountLinked'),
                    duration: 5000,
                  });
                }
                
                // 重定向到設置頁面，因為這是帳戶連結操作
                setTimeout(() => {
                  navigate('/settings');
                }, 2000);
                return;
              }
            } catch (getUserError) {
              console.log('直接獲取用戶也失敗:', getUserError);
              
              // 檢查是否是權限錯誤
              if (getUserError.message && getUserError.message.includes('missing scope')) {
                console.log('檢測到權限錯誤，可能是 guests 角色，等待一下再試...');
                
                // 等待更長時間，讓 Appwrite 完成會話創建
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                try {
                  currentUser = await account.get();
                  console.log('延遲後獲取用戶成功:', currentUser?.email);
                  
                  if (currentUser) {
                    // 嘗試刷新用戶狀態
                    try {
                      await refreshUser();
                    } catch (refreshError) {
                      console.warn('刷新用戶狀態失敗，但用戶已存在:', refreshError);
                    }
                    
                    console.log('延遲後 OAuth 連結並登入成功');
                    setStatus('success');
                    setMessage(t('oauth.linkSuccess'));
                    
                    localStorage.setItem('googleLinkSuccess', 'true');
                    localStorage.setItem('needSessionRefresh', 'true');
                    
                    // 設置 OAuth 特定的會話標記，防止被自動登出
                    sessionStorage.setItem('oauthSession', 'true');
                    
                    if (!toastShownRef.current) {
                      toastShownRef.current = true;
                      toast({
                        variant: "success",
                        title: t('oauth.linkSuccess'),
                        description: t('oauth.googleAccountLinked'),
                        duration: 5000,
                      });
                    }
                    
                    setTimeout(() => {
                      navigate('/settings');
                    }, 2000);
                    return;
                  }
                } catch (delayedError) {
                  console.error('延遲後仍然無法獲取用戶:', delayedError);
                  
                  // 檢查是否是權限錯誤（guests 角色缺少 account 權限）
                  if (delayedError.message && 
                      (delayedError.message.includes('missing scope') || 
                       delayedError.message.includes('guests'))) {
                    
                    console.log('檢測到權限錯誤，但 Google 帳戶連結可能已成功');
                    console.log('將優雅地登出用戶並要求重新登入');
                    
                    // 設置成功標記，表示連結成功但需要重新登入
                    localStorage.setItem('googleLinkSuccessNeedRelogin', 'true');
                    
                    // 顯示成功但需要重新登入的消息
                    setStatus('success');
                    setMessage(t('oauth.linkSuccessNeedRelogin'));
                    setNeedRelogin(true);
                    
                    if (!toastShownRef.current) {
                      toastShownRef.current = true;
                      toast({
                        variant: "default",
                        title: t('oauth.linkSuccess'),
                        description: t('oauth.linkSuccessNeedRelogin'),
                        duration: 6000,
                      });
                    }
                    
                    // 清理當前會話並重定向到登入頁面
                    setTimeout(async () => {
                      try {
                        // 嘗試登出當前會話
                        await account.deleteSession('current');
                      } catch (logoutError) {
                        console.log('登出失敗，但繼續重定向:', logoutError);
                      }
                      
                      // 重定向到登入頁面
                      window.location.href = '/login';
                    }, 3000);
                    return;
                  }
                  
                  // 其他類型的錯誤，顯示會話過期錯誤
                  console.log('會話可能已失效，重定向到登入頁面...');
                  
                  setStatus('error');
                  setMessage(t('oauth.sessionExpired'));
                  
                  if (!toastShownRef.current) {
                    toastShownRef.current = true;
                    toast({
                      variant: "destructive",
                      title: t('oauth.linkFailed'),
                      description: t('oauth.sessionExpired'),
                      duration: 5000,
                    });
                  }
                  
                  // 清理可能的殘留標記
                  localStorage.removeItem('googleLinkSuccess');
                  localStorage.removeItem('needSessionRefresh');
                  sessionStorage.removeItem('oauthSession');
                  
                  setTimeout(() => {
                    navigate('/login');
                  }, 3000);
                  return;
                }
              }
            }
            
            // 如果所有嘗試都失敗，檢查是否是權限相關問題
            console.log('無法獲取用戶信息，檢查是否為權限問題...');
            
            // 假設這是權限問題導致的，但連結可能已成功
            console.log('假設 Google 帳戶連結已成功，但需要重新登入');
            
            // 設置成功標記，表示連結成功但需要重新登入
            localStorage.setItem('googleLinkSuccessNeedRelogin', 'true');
            
            setStatus('success');
            setMessage(t('oauth.linkSuccessNeedRelogin'));
            setNeedRelogin(true);
            
            if (!toastShownRef.current) {
              toastShownRef.current = true;
              toast({
                variant: "default",
                title: t('oauth.linkSuccess'),
                description: t('oauth.linkSuccessNeedRelogin'),
                duration: 6000,
              });
            }
            
            // 清理當前會話並重定向到登入頁面
            setTimeout(async () => {
              try {
                // 嘗試登出當前會話
                await account.deleteSession('current');
              } catch (logoutError) {
                console.log('登出失敗，但繼續重定向:', logoutError);
              }
              
              // 重定向到登入頁面
              window.location.href = '/login';
            }, 3000);
            return;
          }
          
          // 用戶已登入，這是純粹的帳戶連結操作
          console.log('用戶已登入，檢查連結狀態...');
          
          // 多次檢查連結狀態，因為 Appwrite 可能需要時間同步
          let isLinked = false;
          let attempts = 0;
          const maxAttempts = 5;
          
          while (!isLinked && attempts < maxAttempts) {
            console.log(`檢查 Google 連結狀態，嘗試 ${attempts + 1}/${maxAttempts}...`);
            
            try {
              // 嘗試刷新用戶資料
              if (attempts === 0) {
                await refreshUser();
              }
              
              isLinked = await oauthService.isGoogleLinked();
              console.log(`嘗試 ${attempts + 1} 的連結狀態:`, isLinked);
              
              if (!isLinked && attempts < maxAttempts - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            } catch (checkError) {
              console.error(`檢查連結狀態失敗 (嘗試 ${attempts + 1}):`, checkError);
              if (attempts < maxAttempts - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
            
            attempts++;
          }
          
          console.log('最終連結狀態:', isLinked);
          
          // 如果檢測到連結成功或假設連結成功
          setStatus('success');
          setMessage(t('oauth.linkSuccess'));
          
          // 設置成功標記，讓設置頁面知道連結成功
          localStorage.setItem('googleLinkSuccess', 'true');
          
          // 設置 OAuth 特定的會話標記，防止被自動登出
          sessionStorage.setItem('oauthSession', 'true');
          
          if (!toastShownRef.current) {
            toastShownRef.current = true;
            toast({
              variant: "success",
              title: t('oauth.linkSuccess'),
              description: t('oauth.googleAccountLinked'),
              duration: 5000,
            });
          }
          
          setTimeout(() => {
            navigate('/settings');
          }, 2000);
          return;
        }
        
        // 如果不是帳戶連結回調，檢查是否是登入操作
        console.log('不是帳戶連結回調，檢查登入操作...');
        
        // 檢查用戶登入狀態
        let currentUser;
        try {
          currentUser = await account.get();
          console.log('當前用戶:', currentUser?.email);
        } catch (userError) {
          console.log('無法獲取當前用戶，可能未登入');
          currentUser = null;
        }
        
        if (!currentUser) {
          // 用戶未登入，這可能是登入操作，重定向到登入回調頁面
          console.log('用戶未登入，重定向到登入回調頁面...');
          const currentUrl = window.location.href;
          const loginCallbackUrl = currentUrl.replace('/oauth/callback', '/oauth/login-callback');
          window.location.href = loginCallbackUrl;
          return;
        }
        
        // 如果到這裡，說明有未預期的情況
        console.log('未預期的 OAuth 回調情況');
        setStatus('error');
        setMessage(t('oauth.callbackError'));
        
        if (!toastShownRef.current) {
          toastShownRef.current = true;
          toast({
            variant: "destructive",
            title: t('oauth.linkFailed'),
            description: t('oauth.callbackError'),
            duration: 5000,
          });
        }
        
        setTimeout(() => {
          navigate('/settings');
        }, 3000);
        
      } catch (error: any) {
        console.error('處理 OAuth 回調失敗:', error);
        setStatus('error');
        setMessage(error.message || t('oauth.callbackError'));
        
        if (!toastShownRef.current) {
          toastShownRef.current = true;
          toast({
            variant: "destructive",
            title: t('oauth.linkFailed'),
            description: error.message || t('oauth.callbackError'),
            duration: 5000,
          });
        }
        
        setTimeout(() => {
          navigate('/settings');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, user, refreshUser, t]);

  const handleReturnToSettings = () => {
    navigate('/settings');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && (
              <>
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
          <p className="text-muted-foreground whitespace-pre-line">
            {status === 'loading' && t('oauth.processingDescription')}
            {status === 'success' && (needRelogin ? t('oauth.successDescriptionNeedRelogin') : t('oauth.successDescription'))}
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