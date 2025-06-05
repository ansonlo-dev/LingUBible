import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { User, Mail, CheckCircle, AlertTriangle, Save, ArrowLeft, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UsernameValidator } from '@/utils/usernameValidator';
import { authService } from '@/services/auth';

export default function UserSettings() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const [usernameError, setUsernameError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Delete account states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    
    if (newUsername.trim() === '') {
      setIsUsernameValid(true);
      setUsernameError('');
      return;
    }
    
    // 驗證用戶名
    const validation = UsernameValidator.validate(newUsername);
    setIsUsernameValid(validation.isValid);
    setUsernameError(validation.error || '');
  };

  const handleSave = async () => {
    if (!user) return;

    // 如果用戶名為空，使用郵箱作為 name
    const nameToSave = username.trim() || user.email;

    if (username.trim() && !isUsernameValid) {
      toast({
        variant: "destructive",
        title: t('settings.saveFailed'),
        description: usernameError,
      });
      return;
    }

    setLoading(true);

    try {
      // 更新用戶名
      await authService.updateUserName(nameToSave);
      
      setOriginalUsername(username);
      
      toast({
        variant: "success",
        title: t('settings.saveSuccess'),
        description: username.trim() ? t('settings.usernameUpdated', { username }) : t('settings.usernameCleared'),
      });
    } catch (error: any) {
      console.error('更新用戶名失敗:', error);
      toast({
        variant: "destructive",
        title: t('settings.saveFailed'),
        description: error.message || t('settings.updateError'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUsername(originalUsername);
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirmEmail !== user.email) {
      toast({
        variant: "destructive",
        title: t('settings.deleteAccount.emailMismatch'),
        description: t('settings.deleteAccount.emailMismatchDesc'),
      });
      return;
    }

    setDeleteLoading(true);

    try {
      // 調用實際的帳戶刪除/禁用功能
      await authService.deleteAccount();
      
      toast({
        variant: "success",
        title: t('settings.deleteAccount.success'),
        description: t('settings.deleteAccount.successDesc'),
      });
      
      // 關閉對話框
      setDeleteDialogOpen(false);
      
      // 重定向到首頁（帳戶已被禁用）
      window.location.href = '/';
      
    } catch (error: any) {
      console.error('刪除帳戶失敗:', error);
      toast({
        variant: "destructive",
        title: t('settings.deleteAccount.failed'),
        description: error.message || t('settings.deleteAccount.failedDesc'),
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('settings.backToHome')}
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('settings.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左側：個人資料 */}
          <div className="lg:col-span-3 space-y-6">
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
                {/* 郵箱（只讀） */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t('settings.email')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={user.email}
                    autoComplete="email"
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('settings.emailReadOnly')}
                  </p>
                </div>

                <Separator />

                {/* 用戶名 */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('settings.username')}
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder={t('settings.usernamePlaceholder')}
                    autoComplete="username"
                    disabled={loading}
                    className={usernameError ? 'border-red-500' : isUsernameValid && username ? 'border-green-500' : ''}
                  />
                  
                  {/* 用戶名驗證提示 */}
                  {usernameError && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {usernameError}
                    </p>
                  )}
                  
                  {isUsernameValid && username && (
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {t('settings.usernameAvailable')}
                    </p>
                  )}

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>{t('settings.usernameRules')}</div>
                    <div>{t('settings.usernameLength')}</div>
                    <div>{t('settings.usernameSupported')}</div>
                    <div>{t('settings.usernameEmpty')}</div>
                    <div>{t('settings.usernameDisplay')}</div>
                  </div>
                </div>

                {/* 保存按鈕 - 水平居中 */}
                <div className="flex justify-center gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={loading || !hasChanges || (username.trim() && !isUsernameValid)}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {loading ? t('settings.saving') : t('settings.saveChanges')}
                  </Button>
                  
                  {hasChanges && (
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      disabled={loading}
                    >
                      {t('settings.reset')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 危險區域 */}
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  {t('settings.dangerZone.title')}
                </CardTitle>
                <CardDescription>
                  {t('settings.dangerZone.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="border-red-200 dark:border-red-800 mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {t('settings.dangerZone.warning')}
                  </AlertDescription>
                </Alert>

                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    💡 {t('settings.dangerZone.completeDeleteInfo')}
                  </p>
                </div>

                <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    🔄 {t('settings.dangerZone.reEnableInfo')}
                  </p>
                </div>

                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <div className="flex justify-center">
                      <Button 
                        variant="destructive" 
                        className="flex items-center gap-2 hover:bg-red-600 dark:hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t('settings.dangerZone.deleteAccount')}
                      </Button>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-white dark:bg-background border border-gray-200 dark:border-border">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <AlertTriangle className="h-5 w-5" />
                        {t('settings.dangerZone.confirmDelete')}
                      </DialogTitle>
                      <DialogDescription className="space-y-2">
                        <p>{t('settings.dangerZone.confirmDeleteDesc')}</p>
                        <p className="font-semibold text-red-600 dark:text-red-400">
                          {t('settings.dangerZone.irreversibleWarning')}
                        </p>
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="confirmEmail">
                          {t('settings.dangerZone.confirmEmailLabel')}
                        </Label>
                        <Input
                          id="confirmEmail"
                          type="email"
                          value={deleteConfirmEmail}
                          onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                          placeholder={user.email}
                          disabled={deleteLoading}
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('settings.dangerZone.confirmEmailDesc')}
                        </p>
                      </div>
                    </div>

                    <DialogFooter className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDeleteDialogOpen(false);
                          setDeleteConfirmEmail('');
                        }}
                        disabled={deleteLoading}
                      >
                        {t('settings.dangerZone.cancel')}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading || deleteConfirmEmail !== user.email}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleteLoading ? t('settings.dangerZone.deleting') : t('settings.dangerZone.confirmDeleteButton')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 