import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { oauthService } from '@/services/api/oauth';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Link as LinkIcon, Unlink, CheckCircle, AlertTriangle } from 'lucide-react';

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
  }, []);

  const checkGoogleLinkStatus = async () => {
    try {
      setLoading(true);
      const linked = await oauthService.isGoogleLinked();
      setIsLinked(linked);
      
      if (linked) {
        const accountInfo = await oauthService.getGoogleAccountInfo();
        setGoogleAccount(accountInfo);
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
      await oauthService.linkGoogleAccount();
      // 重定向會在 oauthService.linkGoogleAccount() 中處理
    } catch (error: any) {
      console.error('連結 Google 帳戶失敗:', error);
      toast({
        variant: "destructive",
        title: t('oauth.linkFailed'),
        description: error.message || t('oauth.linkError'),
        duration: 5000,
      });
      setActionLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    try {
      setActionLoading(true);
      const result = await oauthService.unlinkGoogleAccount();
      
      if (result.success) {
        setIsLinked(false);
        setGoogleAccount(null);
        
        const message = result.messageKey ? t(result.messageKey) : result.message;
        toast({
          variant: "success",
          title: t('oauth.unlinkSuccess'),
          description: message,
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
            <LinkIcon className="h-5 w-5" />
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
          <LinkIcon className="h-5 w-5" />
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
                <Badge variant="secondary" className="ml-2">
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
              <p className="text-sm text-muted-foreground">
                {t('oauth.linkBenefits')}
              </p>
              
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
                    <LinkIcon className="h-4 w-4 mr-2" />
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