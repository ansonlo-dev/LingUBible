import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SmartAvatar } from '@/components/ui/smart-avatar';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAvatarPreferences } from '@/hooks/useAvatarPreferences';
import { Separator } from '@/components/ui/separator';
import { Info, RefreshCw } from 'lucide-react';

export function AvatarSettings() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { preferences, updatePreferences, isLoaded } = useAvatarPreferences();
  const [previewReviewId, setPreviewReviewId] = useState('preview-review-123');

  // 重新生成預覽頭像
  const regeneratePreview = () => {
    setPreviewReviewId(`preview-review-${Date.now()}`);
  };

  if (!user || !isLoaded) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>頭像設置</span>
          <Info className="h-4 w-4 text-muted-foreground" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 個人頭像設置 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="personal-avatar" className="text-base font-medium">
                顯示個人頭像
              </Label>
              <p className="text-sm text-muted-foreground">
                在個人資料、菜單等地方顯示您的專屬可愛頭像
              </p>
            </div>
            <Switch
              id="personal-avatar"
              checked={preferences.showPersonalAvatar}
              onCheckedChange={(checked) =>
                updatePreferences({ showPersonalAvatar: checked })
              }
            />
          </div>

          {/* 個人頭像預覽 */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <SmartAvatar
              userId={user.$id}
              name={user.name}
              email={user.email}
              config={{
                showPersonalAvatar: preferences.showPersonalAvatar,
                showAnonymousAvatar: false,
                size: 'md',
                context: 'profile'
              }}
              className="border-2 border-primary/20"
            />
            <div>
              <p className="text-sm font-medium">您的個人頭像</p>
              <p className="text-xs text-muted-foreground">
                {preferences.showPersonalAvatar 
                  ? '基於您的用戶ID生成的專屬頭像' 
                  : '顯示姓名首字母'}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* 匿名頭像設置 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="anonymous-avatar" className="text-base font-medium">
                在評論中顯示匿名頭像
              </Label>
              <p className="text-sm text-muted-foreground">
                為每個評論生成隨機頭像，增加視覺趣味但保持匿名性
              </p>
            </div>
            <Switch
              id="anonymous-avatar"
              checked={preferences.showAnonymousAvatarInReviews}
              onCheckedChange={(checked) =>
                updatePreferences({ showAnonymousAvatarInReviews: checked })
              }
            />
          </div>

          {/* 匿名頭像預覽 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">匿名頭像預覽</p>
              <Button
                variant="outline"
                size="sm"
                onClick={regeneratePreview}
                className="h-8"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                重新生成
              </Button>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              {preferences.showAnonymousAvatarInReviews ? (
                <SmartAvatar
                  reviewId={previewReviewId}
                  config={{
                    showPersonalAvatar: false,
                    showAnonymousAvatar: true,
                    size: 'md',
                    context: 'review'
                  }}
                  className="flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">無</span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium">評論頭像</p>
                <p className="text-xs text-muted-foreground">
                  {preferences.showAnonymousAvatarInReviews 
                    ? '每個評論都有獨特的匿名頭像' 
                    : '評論中不顯示頭像'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* 說明信息 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">關於頭像系統</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• 個人頭像基於您的用戶ID生成，每次登入都是相同的</li>
            <li>• 匿名頭像基於評論ID生成，同一評論的頭像保持一致</li>
            <li>• 所有頭像都是本地生成，不會上傳任何個人信息</li>
            <li>• 匿名頭像不會洩露您的身份信息</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 