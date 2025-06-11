import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { oauthService } from '@/services/api/oauth';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Link as LinkIcon, Unlink, CheckCircle, AlertTriangle } from 'lucide-react';
import { GoogleIcon } from '@/components/icons/GoogleIcon';

interface GoogleAccountInfo {
  email?: string;
  name?: string;
  provider: string;
  providerUid: string;
}

export function GoogleAccountLink() {
  const { t } = useLanguage();
  const [isLinked, setIsLinked] = useState(false);
  const [googleAccount, setGoogleAccount] = useState<GoogleAccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    checkGoogleLinkStatus();
    
    // 檢查是否有連結成功的標記
    const checkLinkSuccess = () => {
      const linkSuccess = localStorage.getItem('googleLinkSuccess');
      if (linkSuccess === 'true') {
        localStorage.removeItem('googleLinkSuccess');
        // 延遲一下再檢查，確保 Appwrite 已經更新
        setTimeout(() => {
          checkGoogleLinkStatus();
        }, 500);
      }
    };
    
    checkLinkSuccess();
    
    // 監聽頁面焦點事件，當用戶從 OAuth 回調返回時重新檢查狀態
    const handleFocus = () => {
      checkLinkSuccess();
      checkGoogleLinkStatus();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const checkGoogleLinkStatus = async () => {
    try {
      setLoading(true);
      const linked = await oauthService.isGoogleLinked();
      setIsLinked(linked);
      
      if (linked) {
        const accountInfo = await oauthService.getGoogleAccountInfo();
        setGoogleAccount(accountInfo);
        // 如果連結成功，重置 actionLoading 狀態
        setActionLoading(false);
      }
    } catch (error) {
      console.error('檢查 Google 連結狀態失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    try {
      setActionLoading(true);
      
      // 設置 OAuth 嘗試時間戳，用於保護用戶在 OAuth 流程中不被登出
      localStorage.setItem('lastOAuthAttempt', Date.now().toString());
      
      // 等待一下，確保狀態更新
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 設置一個超時機制，如果 5 秒後還沒有重定向，就假設成功了
      const timeoutId = setTimeout(() => {
        console.log('OAuth 流程超時，假設重定向成功');
        // 不重置 actionLoading，因為頁面應該已經重定向了
      }, 5000);
      
      try {
        await oauthService.linkGoogleAccount();
        clearTimeout(timeoutId);
        // 重定向會在 oauthService.linkGoogleAccount() 中處理
        // 不需要設置 actionLoading 為 false，因為頁面會重定向
      } catch (linkError) {
        clearTimeout(timeoutId);
        throw linkError;
      }
    } catch (error: any) {
      console.error('連結 Google 帳戶失敗:', error);
      
      // 檢查是否是重定向相關的錯誤（這些通常不是真正的錯誤）
      if (error.message && (
        error.message.includes('redirect') ||
        error.message.includes('navigation') ||
        error.message.includes('aborted') ||
        error.message.includes('cancelled') ||
        error.message.includes('interrupted') ||
        error.message.includes('blocked') ||
        error.message.includes('popup') ||
        error.message.includes('window') ||
        error.name === 'AbortError' ||
        error.name === 'NavigationError' ||
        error.name === 'NetworkError' ||
        error.code === 'NETWORK_ERROR' ||
        error.code === 'ABORT_ERR'
      )) {
        // 這些錯誤通常是由於頁面重定向導致的，不需要顯示錯誤
        console.log('檢測到重定向相關錯誤，忽略:', error.message);
        return;
      }
      
      // 檢查是否是 Appwrite 特定的錯誤
      if (error.code && (
        error.code === 401 || // 未授權
        error.code === 403 || // 禁止訪問
        error.code === 500 || // 服務器錯誤
        error.code === 503    // 服務不可用
      )) {
        // 這些可能是暫時的服務器問題，不一定是真正的錯誤
        console.log('檢測到可能的服務器錯誤，但可能已經重定向:', error.code);
        
        // 等待一下，看看是否會重定向
        setTimeout(() => {
          // 如果 2 秒後還在這個頁面，才顯示錯誤
          if (document.visibilityState === 'visible') {
            console.log('2 秒後仍在頁面，顯示錯誤');
            showError(error);
          }
        }, 2000);
        return;
      }
      
      showError(error);
    }
  };
  
  // 提取錯誤顯示邏輯到單獨的方法
  const showError = (error: any) => {
    // 處理不同類型的錯誤
    let errorMessage = t('oauth.linkError');
    let errorTitle = t('oauth.linkFailed');
    
    if (error.message) {
      // 檢查是否是特定的錯誤類型
      if (error.message === 'ACCOUNT_ALREADY_LINKED' || 
          error.name === 'AccountAlreadyLinkedError') {
        errorMessage = t('oauth.accountAlreadyLinkedToAnother');
        errorTitle = t('oauth.accountAlreadyLinked');
      } else if (error.message === 'MUST_BE_LOGGED_IN' || 
                 error.name === 'AuthenticationRequiredError') {
        errorMessage = t('oauth.mustBeLoggedIn');
      } else if (error.message.includes('already linked') || 
                 error.message.includes('already exists') ||
                 error.message.includes('already associated') ||
                 error.message.includes('user_already_exists') ||
                 error.code === 409) {
        errorMessage = t('oauth.accountAlreadyLinkedToAnother');
        errorTitle = t('oauth.accountAlreadyLinked');
      } else if (error.message.includes('User must be logged in')) {
        errorMessage = t('oauth.mustBeLoggedIn');
      } else {
        // 其他錯誤，顯示通用錯誤訊息
        errorMessage = t('oauth.linkError');
      }
    }
    
    toast({
      variant: "destructive",
      title: errorTitle,
      description: errorMessage,
      duration: 5000,
    });
    setActionLoading(false);
  };

  const handleUnlinkGoogle = async () => {
    try {
      setActionLoading(true);
      const result = await oauthService.unlinkGoogleAccount();
      
      if (result.success) {
        setIsLinked(false);
        setGoogleAccount(null);
        
        toast({
          variant: "success",
          title: t('oauth.unlinkSuccess'),
          duration: 5000,
        });
      } else {
        const errorMessage = result.messageKey ? t(result.messageKey) : result.message;
        toast({
          variant: "destructive",
          title: t('oauth.unlinkFailed'),
          description: errorMessage,
          duration: 5000,
        });
      }
    } catch (error: any) {
      console.error('取消連結 Google 帳戶失敗:', error);
      toast({
        variant: "destructive",
        title: t('oauth.unlinkFailed'),
        description: error.message || t('oauth.unlinkError'),
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GoogleIcon size={20} />
            {t('oauth.googleAccount')}
          </CardTitle>
          <CardDescription>
            {t('oauth.googleAccountDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GoogleIcon size={20} />
          {t('oauth.googleAccount')}
        </CardTitle>
        <CardDescription>
          {t('oauth.googleAccountDescription')}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLinked ? (
          <>
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{t('oauth.accountLinked')}</div>
                  {googleAccount?.email && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {googleAccount.email}
                    </div>
                  )}
                </div>
                <Badge variant="default" className="ml-2 bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t('oauth.linked')}
                </Badge>
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t('oauth.linkedDescription')}
              </p>
              
              <Button
                variant="outline"
                onClick={handleUnlinkGoogle}
                disabled={actionLoading}
                className="w-full"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('oauth.unlinking')}
                  </>
                ) : (
                  <>
                    <Unlink className="h-4 w-4 mr-2" />
                    {t('oauth.unlinkGoogle')}
                  </>
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium">{t('oauth.notLinked')}</div>
                <div className="text-sm mt-1">
                  {t('oauth.notLinkedDescription')}
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Button
                onClick={handleLinkGoogle}
                disabled={actionLoading}
                className="w-full"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('oauth.linking')}
                  </>
                ) : (
                  <>
                    <GoogleIcon size={16} className="mr-2" variant="white" />
                    {t('oauth.linkGoogle')}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 