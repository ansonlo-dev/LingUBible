import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { User, Mail, CheckCircle, Save, ArrowLeft, Loader2, Lock, Palette } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UsernameValidator } from "@/utils/auth/usernameValidator";
import { authService } from "@/services/api/auth";
import { PasswordInput } from '@/components/ui/password-input';
import { PasswordStrengthChecker } from '@/components/auth/PasswordStrengthChecker';
import { AvatarCustomizer } from '@/components/user/AvatarCustomizer';
import { SmartAvatar } from '@/components/ui/smart-avatar';
import { useCustomAvatar } from '@/hooks/useCustomAvatar';
import { GoogleAccountLink } from '@/components/user/GoogleAccountLink';

export default function UserSettings() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const { customAvatar, isInitialLoading } = useCustomAvatar();
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [usernameError, setUsernameError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameCheckTimeout, setUsernameCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // 密碼更改相關狀態
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isNewPasswordValid, setIsNewPasswordValid] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [hasPasswordChanges, setHasPasswordChanges] = useState(false);

  useEffect(() => {
    if (user) {
      const currentUsername = user.name && user.name !== user.email ? user.name : '';
      setUsername(currentUsername);
      setOriginalUsername(currentUsername);
    }
  }, [user]);

  useEffect(() => {
    setHasChanges(username !== originalUsername);
  }, [username, originalUsername]);

  useEffect(() => {
    setHasPasswordChanges(currentPassword !== '' || newPassword !== '' || confirmPassword !== '');
  }, [currentPassword, newPassword, confirmPassword]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    
    // 清除之前的檢查超時
    if (usernameCheckTimeout) {
      clearTimeout(usernameCheckTimeout);
    }
    
    if (newUsername.trim() === '') {
      setIsUsernameValid(true);
      setUsernameError('');
      setIsCheckingUsername(false);
      return;
    }
    
    // 如果用戶名沒有變化，不需要檢查
    if (newUsername.trim() === originalUsername) {
      setIsUsernameValid(true);
      setUsernameError('');
      setIsCheckingUsername(false);
      return;
    }
    
    // 先進行基本驗證
    const validation = UsernameValidator.validate(newUsername);
    if (!validation.isValid) {
      setIsUsernameValid(false);
      // 使用翻譯鍵值或回退到原始訊息
      const errorMessage = validation.errorKey ? t(validation.errorKey) : validation.error || '';
      setUsernameError(errorMessage);
      setIsCheckingUsername(false);
      return;
    }
    
    // 基本驗證通過，開始檢查唯一性
    setIsCheckingUsername(true);
    setUsernameError('');
    
    // 設置延遲檢查，避免頻繁請求
    const timeout = setTimeout(async () => {
      try {
        const result = await authService.checkUsernameAvailability(newUsername.trim());
        
        if (result.available) {
          setIsUsernameValid(true);
          setUsernameError('');
        } else {
          setIsUsernameValid(false);
          // 使用翻譯鍵值或回退到原始訊息
          const errorMessage = result.messageKey ? t(result.messageKey) : result.message;
          setUsernameError(errorMessage);
        }
      } catch (error) {
        console.error('檢查用戶名失敗:', error);
        setIsUsernameValid(false);
        setUsernameError(t('username.checkError'));
      } finally {
        setIsCheckingUsername(false);
      }
    }, 800); // 800ms 延遲
    
    setUsernameCheckTimeout(timeout);
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);

          try {
        // 更新用戶名
        await authService.updateUserName(username.trim() || user.email);
      
      // 刷新用戶資料
      await refreshUser();
      
      // 更新原始用戶名
      setOriginalUsername(username);
      
      toast({
        title: t('settings.saveSuccess'),
        description: username.trim() 
          ? t('settings.usernameUpdated', { username: username.trim() })
          : t('settings.usernameCleared'),
        className: "border-green-300 bg-green-100 dark:bg-green-900 dark:border-green-600 text-green-900 dark:text-green-100",
      });
      
    } catch (error: any) {
      console.error('更新用戶名失敗:', error);
      toast({
        variant: "destructive",
        title: t('settings.saveFailed'),
        description: error.message || t('settings.updateError'),
        className: "border-red-300 bg-red-100 dark:bg-red-900 dark:border-red-600 text-red-900 dark:text-red-100",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUsername(originalUsername);
  };

  const handlePasswordSave = async () => {
    if (!user) return;

    // 驗證輸入
    if (!currentPassword.trim()) {
      toast({
        variant: "destructive",
        title: t('settings.passwordUpdateFailed'),
        description: t('settings.currentPasswordRequired'),
        className: "border-red-300 bg-red-100 dark:bg-red-900 dark:border-red-600 text-red-900 dark:text-red-100",
      });
      return;
    }

    if (!newPassword.trim()) {
      toast({
        variant: "destructive",
        title: t('settings.passwordUpdateFailed'),
        description: t('settings.newPasswordRequired'),
        className: "border-red-300 bg-red-100 dark:bg-red-900 dark:border-red-600 text-red-900 dark:text-red-100",
      });
      return;
    }

    if (!isNewPasswordValid) {
      toast({
        variant: "destructive",
        title: t('settings.passwordUpdateFailed'),
        description: t('settings.passwordTooWeak'),
        className: "border-red-300 bg-red-100 dark:bg-red-900 dark:border-red-600 text-red-900 dark:text-red-100",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: t('settings.passwordUpdateFailed'),
        description: t('settings.passwordMismatch'),
        className: "border-red-300 bg-red-100 dark:bg-red-900 dark:border-red-600 text-red-900 dark:text-red-100",
      });
      return;
    }

    // 檢查新密碼是否與目前密碼相同
    if (newPassword === currentPassword) {
      toast({
        variant: "destructive",
        title: t('settings.passwordUpdateFailed'),
        description: t('settings.passwordSameAsOld'),
        className: "border-red-300 bg-red-100 dark:bg-red-900 dark:border-red-600 text-red-900 dark:text-red-100",
      });
      return;
    }

    setPasswordLoading(true);

    try {
      await authService.updatePassword(newPassword, currentPassword);
      
      // 清空密碼字段
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      toast({
        title: t('settings.passwordUpdateSuccess'),
        className: "border-green-300 bg-green-100 dark:bg-green-900 dark:border-green-600 text-green-900 dark:text-green-100",
      });
      
    } catch (error: any) {
      console.error('更新密碼失敗:', error);
      
      let errorMessage = t('settings.passwordUpdateFailed');
      if (error.message === '目前密碼不正確') {
        errorMessage = t('settings.wrongCurrentPassword');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: "destructive",
        title: t('settings.passwordUpdateFailed'),
        description: errorMessage,
        className: "border-red-300 bg-red-100 dark:bg-red-900 dark:border-red-600 text-red-900 dark:text-red-100",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordReset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // 統一保存函數 - 處理用戶名和密碼更改
  const handleSaveAll = async () => {
    if (!user) return;

    const hasUsernameChanges = hasChanges;
    const hasPasswordChangesToSave = hasPasswordChanges && 
      currentPassword.trim() && 
      newPassword.trim() && 
      confirmPassword.trim() &&
      isNewPasswordValid &&
      newPassword === confirmPassword;

    // 如果有用戶名更改，先保存用戶名
    if (hasUsernameChanges) {
      await handleSave();
    }

    // 如果有密碼更改，保存密碼
    if (hasPasswordChangesToSave) {
      await handlePasswordSave();
    }
  };

  // 統一重設函數
  const handleResetAll = () => {
    // 重設用戶名
    if (hasChanges) {
      handleReset();
    }
    
    // 重設密碼字段
    if (hasPasswordChanges) {
      handlePasswordReset();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">{t('settings.loginRequired')}</p>
              <Button asChild className="mt-4">
                <Link to="/login">{t('settings.login')}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 頁面標題 */}
        <div className="mb-6">
          <Button asChild variant="ghost" className="mb-4">
            <Link to="/" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('settings.backToHome')}
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
        </div>

        {/* 個人資料設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('settings.profile')}
            </CardTitle>
            <CardDescription>
              {t('settings.profileDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 頭像 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2 text-base font-medium">
                    <User className="h-4 w-4" />
                    {t('settings.avatar')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.avatarDescription')}
                  </p>
                </div>
                <AvatarCustomizer>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    {t('avatar.customize')}
                  </Button>
                </AvatarCustomizer>
              </div>
              
              {/* 頭像預覽 */}
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <SmartAvatar
                  userId={user.$id}
                  name={user.name}
                  email={user.email}
                  customAvatar={customAvatar}
                  isLoading={isInitialLoading}
                  config={{
                    showPersonalAvatar: true,
                    showAnonymousAvatar: false,
                    size: 'lg',
                    context: 'profile'
                  }}
                  className="border-2 border-primary/20"
                />
                <div className="space-y-1">
                  <p className="font-medium">{t('settings.currentAvatar')}</p>
                  <p className="text-sm text-muted-foreground">
                    {customAvatar ? t('settings.customAvatar') : t('settings.defaultAvatar')}
                  </p>
                </div>
              </div>
            </div>

            {/* 電子郵件 */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t('settings.email')}
              </Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                {t('settings.emailReadOnly')}
              </p>
            </div>

            {/* 用戶名 */}
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('settings.username')}
                {isCheckingUsername && (
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                )}
                {!isCheckingUsername && isUsernameValid && username.trim() && username.trim() !== originalUsername && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder={t('settings.usernamePlaceholder')}
                disabled={loading}
                className={!isUsernameValid ? 'border-red-500' : isCheckingUsername ? 'border-blue-500' : ''}
              />
              
              {/* 用戶名驗證錯誤 */}
              {!isUsernameValid && usernameError && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                  <AlertDescription className="text-red-600 dark:text-red-400">
                    {usernameError}
                  </AlertDescription>
                </Alert>
              )}
              
              {/* 檢查中提示 */}
              {isCheckingUsername && (
                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t('settings.usernameChecking')}
                </p>
              )}
              
              {/* 用戶名可用提示 */}
              {!isCheckingUsername && isUsernameValid && username.trim() && username.trim() !== originalUsername && (
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {t('settings.usernameAvailable')}
                </p>
              )}
              
              {/* 用戶名規則說明 */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">{t('settings.usernameRules')}</p>
                <p>{t('settings.usernameLength')}</p>
                <p>{t('settings.usernameSupported')}</p>
                <p>{t('settings.usernameEmpty')}</p>
                <p>{t('settings.usernameDisplay')}</p>
              </div>
            </div>

            {/* 密碼 */}
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-base font-medium">
                  <Lock className="h-4 w-4" />
                  {t('settings.password')}
                </Label>
              </div>

              {/* 目前密碼 */}
              <div className="space-y-2">
                <Label htmlFor="current-password">
                  {t('settings.currentPassword')}
                </Label>
                <PasswordInput
                  id="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t('settings.currentPasswordPlaceholder')}
                  disabled={passwordLoading}
                />
              </div>

              {/* 新密碼 */}
              <div className="space-y-2">
                <Label htmlFor="new-password">
                  {t('settings.newPassword')}
                </Label>
                <PasswordInput
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('settings.newPasswordPlaceholder')}
                  disabled={passwordLoading}
                />
              </div>

              {/* 密碼強度檢查器 */}
              {newPassword && (
                <PasswordStrengthChecker
                  password={newPassword}
                  email={user.email}
                  onValidationChange={setIsNewPasswordValid}
                />
              )}

              {/* 確認新密碼 */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  {t('settings.confirmPassword')}
                </Label>
                <PasswordInput
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('settings.confirmPasswordPlaceholder')}
                  disabled={passwordLoading}
                />
                
                {/* 密碼不一致提示 */}
                {confirmPassword && newPassword !== confirmPassword && (
                  <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                    <AlertDescription className="text-red-600 dark:text-red-400">
                      {t('settings.passwordMismatch')}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

            </div>

            {/* 統一操作按鈕 */}
            <div className="flex justify-center gap-3 pt-6">
              <Button
                onClick={handleSaveAll}
                disabled={
                  loading || 
                  passwordLoading ||
                  (!hasChanges && !hasPasswordChanges) || 
                  isCheckingUsername || 
                  (username.trim() && !isUsernameValid) ||
                  (hasPasswordChanges && (
                    !currentPassword.trim() || 
                    !newPassword.trim() || 
                    !confirmPassword.trim() ||
                    !isNewPasswordValid ||
                    newPassword !== confirmPassword
                  ))
                }
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {(loading || passwordLoading) ? t('settings.saving') : t('settings.saveChanges')}
              </Button>
              
              {(hasChanges || hasPasswordChanges) && (
                <Button
                  variant="outline"
                  onClick={handleResetAll}
                  disabled={loading || passwordLoading}
                >
                  {t('settings.reset')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Google 帳戶連結 */}
        <div className="mt-8">
          <GoogleAccountLink />
        </div>
      </div>
    </div>
  );
} 