import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
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
  const statusLockRef = useRef(false); // 防止狀態重複設置

  // 安全的狀態設置函數，防止重複設置
  const setStatusSafely = (newStatus: 'loading' | 'success' | 'error', newMessage: string) => {
    if (statusLockRef.current) {
      console.log('🔒 狀態已鎖定，跳過重複設置:', { newStatus, newMessage });
      return false;
    }
    
    console.log('✅ 設置狀態:', { newStatus, newMessage });
    setStatus(newStatus);
    setMessage(newMessage);
    
    // 如果設置為成功或錯誤狀態，鎖定狀態防止後續更改
    if (newStatus === 'success' || newStatus === 'error') {
      statusLockRef.current = true;
      console.log('🔒 狀態已鎖定，防止後續更改');
    }
    
    return true;
  };

  useEffect(() => {
    const handleLoginCallback = async () => {
      try {
        setStatusSafely('loading', t('oauth.processingLogin'));
        
        // 檢查 URL 參數
        const userId = searchParams.get('userId');
        const secret = searchParams.get('secret');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        // 也檢查 URL fragment 中的參數（有些 OAuth 錯誤可能在這裡）
        const fragment = window.location.hash.substring(1);
        const fragmentParams = new URLSearchParams(fragment);
        const fragmentError = fragmentParams.get('error');
        const fragmentErrorDescription = fragmentParams.get('error_description');
        
        console.log('OAuth 回調參數:', { userId, secret, error, errorDescription });
        console.log('Fragment 參數:', { fragmentError, fragmentErrorDescription });
        console.log('完整 URL:', window.location.href);
        console.log('所有 URL 參數:', Object.fromEntries(searchParams.entries()));
        console.log('所有 Fragment 參數:', Object.fromEntries(fragmentParams.entries()));
        
        // 如果有明確的錯誤參數（在 query 或 fragment 中）
        if (error || fragmentError) {
          const actualError = error || fragmentError;
          const actualErrorDescription = errorDescription || fragmentErrorDescription;
          console.error('OAuth 錯誤:', actualError, actualErrorDescription);
          setStatusSafely('error', t('oauth.noLinkedAccount'));
          
          if (!toastShownRef.current) {
            toastShownRef.current = true;
            toast({
              variant: "destructive",
              title: t('oauth.noLinkedAccountTitle'),
              description: t('oauth.noLinkedAccountDescription'),
              duration: 10000,
            });
          }
          
          // 3秒後自動跳轉到註冊頁面
          setTimeout(() => {
            navigate('/register');
          }, 3000);
          return;
        }
        
        // 如果沒有 userId 和 secret，嘗試直接檢查是否已經有有效會話
        if (!userId || !secret) {
          console.log('⚠️ 缺少 OAuth 成功參數 (userId 或 secret)');
          console.log('🔍 嘗試檢查是否已經有有效的用戶會話...');
          
          // 先嘗試獲取當前用戶，如果成功說明已經登入
          try {
            const existingUser = await account.get();
            console.log('✅ 發現現有用戶會話:', existingUser.email);
            console.log('🎉 OAuth 登入可能已經成功，跳過錯誤處理');
            
            // 檢查郵箱是否為學生郵箱
            const email = existingUser.email;
            const isStudentEmail = email && (email.endsWith('@ln.hk') || email.endsWith('@ln.edu.hk'));
            
                         if (!isStudentEmail) {
               console.error('❌ 現有會話不是學生郵箱:', email);
               setStatusSafely('error', t('oauth.studentEmailRequired'));
              setTimeout(() => {
                navigate('/login');
              }, 3000);
              return;
            }
            
                                      // 會話有效且是學生郵箱，直接成功
             await refreshUser();
             const statusSet = setStatusSafely('success', t('oauth.loginSuccess'));
             
             if (statusSet && !toastShownRef.current) {
               toastShownRef.current = true;
               toast({
                 variant: "success",
                 title: t('oauth.loginSuccess'),
                 description: t('oauth.welcomeBack'),
                 duration: 4000,
               });
             }
            
            setTimeout(() => {
              navigate('/');
            }, 1500);
            return;
            
          } catch (sessionError) {
            console.log('❌ 沒有有效會話，繼續檢查 OAuth 流程');
            
            // 檢查是否有任何 OAuth 相關的參數（表示確實經過了 OAuth 流程）
            const hasOAuthParams = searchParams.has('code') || 
                                  searchParams.has('state') || 
                                  fragmentParams.has('code') ||
                                  fragmentParams.has('state') ||
                                  window.location.href.includes('oauth') ||
                                  window.location.href.includes('google');
            
            if (hasOAuthParams) {
                             // 有 OAuth 參數但沒有成功參數且沒有有效會話，很可能是帳戶未連結
               console.log('🔍 檢測到 OAuth 流程但缺少成功參數且無有效會話，判斷為帳戶未連結');
               setStatusSafely('error', t('oauth.noLinkedAccount'));
              
              if (!toastShownRef.current) {
                toastShownRef.current = true;
                toast({
                  variant: "destructive",
                  title: t('oauth.noLinkedAccountTitle'),
                  description: t('oauth.noLinkedAccountDescription'),
                  duration: 10000,
                });
              }
              
              // 3秒後自動跳轉到註冊頁面
              setTimeout(() => {
                navigate('/register');
              }, 3000);
              return;
            } else {
                             // 沒有任何 OAuth 相關參數，可能是直接訪問了這個頁面
               console.error('❌ OAuth 回調缺少必要參數且無 OAuth 流程跡象');
               setStatusSafely('error', t('oauth.missingParameters'));
              setTimeout(() => {
                navigate('/login');
              }, 3000);
              return;
            }
          }
        }
        
        try {
          // 嘗試獲取當前用戶（檢查是否已經有會話）
          const currentUser = await account.get();
          console.log('✅ OAuth 回調中成功獲取到用戶:', currentUser.email);
          console.log('🎉 Google 帳戶已連結且登入成功');
          
          // 檢查郵箱是否為學生郵箱
          const email = currentUser.email;
          const isStudentEmail = email && (email.endsWith('@ln.hk') || email.endsWith('@ln.edu.hk'));
          
          console.log('🔍 OAuth 登入郵箱檢查:', { email, isStudentEmail });
          
          if (!isStudentEmail) {
            // 如果不是學生郵箱，這是一個嚴重的安全問題
            // 我們需要立即刪除用戶帳戶（不只是會話）
            console.error('❌ 非學生郵箱成功創建帳戶，這是安全漏洞:', email);
            
            try {
              // 首先嘗試刪除當前會話
              await account.deleteSession('current');
              console.log('🚫 已刪除當前會話');
              
              // 調用後端清理函數來刪除用戶帳戶
              try {
                console.log('🗑️ 調用後端清理函數刪除用戶帳戶...');
                const response = await fetch(`https://fra.cloud.appwrite.io/v1/functions/cleanup-expired-codes/executions`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Appwrite-Project': 'lingubible',
                  },
                  body: JSON.stringify({
                    body: JSON.stringify({
                      action: 'immediate_cleanup',
                      userId: currentUser.$id,
                      email: email,
                      reason: 'non_student_email_oauth_login'
                    }),
                    async: false,
                    method: 'POST'
                  }),
                });
                
                if (response.ok) {
                  const result = await response.json();
                  console.log('✅ 後端清理函數調用成功:', result);
                } else {
                  const errorText = await response.text();
                  console.error('❌ 後端清理函數調用失敗:', response.status, errorText);
                }
              } catch (cleanupError) {
                console.error('❌ 調用後端清理函數失敗:', cleanupError);
              }
              
              console.error('🚨 安全警告：非學生郵箱帳戶已創建但被阻止登入:', email);
              
            } catch (deleteError) {
              console.error('❌ 刪除會話失敗:', deleteError);
            }
            
            setStatusSafely('error', t('oauth.studentEmailRequired'));
            
            if (!toastShownRef.current) {
              toastShownRef.current = true;
              toast({
                variant: "destructive",
                title: t('oauth.loginFailed'),
                description: t('oauth.studentEmailRequired'),
                duration: 8000, // 延長顯示時間
              });
            }
            
            setTimeout(() => {
              navigate('/login');
            }, 5000); // 延長等待時間，讓用戶看到錯誤訊息
            return;
          }
          
          // 登入成功，刷新用戶狀態
          console.log('✅ OAuth 登入成功，刷新用戶狀態...');
          console.log('📊 用戶信息:', {
            id: currentUser.$id,
            email: currentUser.email,
            name: currentUser.name,
            emailVerification: currentUser.emailVerification,
            status: currentUser.status
          });
          
          // 立即刷新用戶狀態
          await refreshUser();
          console.log('✅ 用戶狀態刷新完成');
          
          // 設置 OAuth 會話標記，幫助其他組件識別這是 OAuth 登入
          sessionStorage.setItem('oauthSession', 'true');
          
          // 設置會話持久性標記，確保 OAuth 登入後刷新頁面不會登出
          // OAuth 登入默認為「記住我」模式，因為用戶選擇了便捷的 OAuth 登入方式
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('savedEmail', currentUser.email);
          sessionStorage.removeItem('sessionOnly'); // 確保不是僅會話模式
          
          console.log('OAuth 登入會話持久性已設置:', {
            rememberMe: 'true',
            savedEmail: currentUser.email,
            sessionOnly: 'removed'
          });
          
          // 調試：檢查會話存儲狀態
          const debugSessionInfo = {
            cookies: document.cookie,
            localStorage_cookieFallback: localStorage.getItem('cookieFallback'),
            localStorage_appwriteSession: localStorage.getItem('appwrite-session'),
            localStorage_rememberMe: localStorage.getItem('rememberMe'),
            sessionStorage_oauthSession: sessionStorage.getItem('oauthSession'),
            sessionStorage_sessionOnly: sessionStorage.getItem('sessionOnly')
          };
          console.log('OAuth 登入後會話調試信息:', debugSessionInfo);
          
          // 設置一個短期標記，讓側邊欄知道需要等待狀態同步
          sessionStorage.setItem('oauthLoginComplete', Date.now().toString());
          
          // 觸發自定義事件，通知其他組件 OAuth 登入完成
          window.dispatchEvent(new CustomEvent('oauthLoginComplete'));
          
          const statusSet = setStatusSafely('success', t('oauth.loginSuccess'));
          
          if (statusSet && !toastShownRef.current) {
            toastShownRef.current = true;
            toast({
              variant: "success",
              title: t('oauth.loginSuccess'),
              description: t('oauth.welcomeBack'),
              duration: 4000,
            });
          }
          
          // 延遲重定向，確保狀態同步完成
          setTimeout(() => {
            // 清理短期標記
            sessionStorage.removeItem('oauthLoginComplete');
            navigate('/');
          }, 1500); // 1.5秒延遲，確保狀態同步
          
        } catch (refreshError) {
          console.error('❌ 處理 OAuth 登入失敗:', refreshError);
          
          // 如果是 account.get() 失敗，說明沒有有效會話，可能是帳戶未連結
          if (refreshError.code === 401 || refreshError.code === 403 || 
              (refreshError.message && (
                refreshError.message.includes('User (role: guests) missing scope') ||
                refreshError.message.includes('missing scope (account)') ||
                refreshError.message.includes('Invalid credentials') ||
                refreshError.message.includes('User not found') ||
                refreshError.message.includes('Unauthorized')
              ))) {
            console.log('🔍 檢測到 Google 帳戶未連結錯誤 (account.get() 失敗)');
            setStatusSafely('error', t('oauth.noLinkedAccount'));
            
            if (!toastShownRef.current) {
              toastShownRef.current = true;
              toast({
                variant: "destructive",
                title: t('oauth.noLinkedAccountTitle'),
                description: t('oauth.noLinkedAccountDescription'),
                duration: 10000,
              });
            }
            
            // 3秒後自動跳轉到註冊頁面
            setTimeout(() => {
              navigate('/register');
            }, 3000);
            return;
          }
          
          // 其他錯誤（不是帳戶未連結的問題）
          console.error('🚨 其他 OAuth 登入錯誤:', refreshError);
          setStatusSafely('error', t('oauth.loginFailed'));
          
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } catch (error: any) {
        console.error('❌ 處理 OAuth 登入回調失敗:', error);
        
        // 只有在明確的認證失敗情況下才判斷為帳戶未連結
        if (error.code === 401 || error.code === 403 || 
            (error.message && (
              error.message.includes('User (role: guests) missing scope') ||
              error.message.includes('missing scope (account)') ||
              error.message.includes('Invalid credentials') ||
              error.message.includes('User not found') ||
              error.message.includes('Unauthorized')
            ))) {
          console.log('🔍 檢測到 Google 帳戶未連結錯誤 (外層 catch)');
          setStatusSafely('error', t('oauth.noLinkedAccount'));
          
          if (!toastShownRef.current) {
            toastShownRef.current = true;
            toast({
              variant: "destructive",
              title: t('oauth.noLinkedAccountTitle'),
              description: t('oauth.noLinkedAccountDescription'),
              duration: 10000,
            });
          }
          
          // 3秒後自動跳轉到註冊頁面
          setTimeout(() => {
            navigate('/register');
          }, 3000);
          return;
        }
        
        // 其他錯誤（網路錯誤、參數錯誤等）
        console.error('🚨 其他 OAuth 回調錯誤:', error);
        setStatusSafely('error', error.message || t('oauth.callbackError'));
        
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

  const handleGoToRegister = () => {
    navigate('/register');
  };

  // 檢查是否是未連結帳戶的錯誤
  const isNoLinkedAccountError = message === t('oauth.noLinkedAccount');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && (
              <>
                {t('oauth.processingLogin')}
              </>
            )}
            {status === 'success' && (
              <>
                {t('oauth.loginSuccess')}
              </>
            )}
            {status === 'error' && (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                {isNoLinkedAccountError ? t('oauth.noLinkedAccountTitle') : t('oauth.loginFailed')}
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
          
          {status === 'success' && (
            <div className="flex justify-center">
              <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-3">
              {isNoLinkedAccountError && (
                <p className="text-sm text-muted-foreground">
                  {t('oauth.redirectingToRegister')}
                </p>
              )}
              <Button 
                onClick={isNoLinkedAccountError ? handleGoToRegister : handleReturnToLogin} 
                className="w-full"
              >
                {isNoLinkedAccountError ? t('oauth.goToRegister') : t('oauth.returnToLogin')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 