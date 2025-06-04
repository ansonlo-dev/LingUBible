import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AvatarSettings } from '@/components/AvatarSettings';
import { AvatarCustomizer } from '@/components/AvatarCustomizer';
import { ReviewCard } from '@/components/ReviewCard';
import { SmartAvatar } from '@/components/ui/smart-avatar';
import { useAvatarPreferences } from '@/hooks/useAvatarPreferences';
import { useCustomAvatar } from '@/hooks/useCustomAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Users, MessageSquare, Palette, Sparkles, BarChart3 } from 'lucide-react';
import { getTotalCombinations, getAllAnimals, getAllBackgrounds } from '@/utils/avatarUtils';

export default function AvatarDemo() {
  const { user } = useAuth();
  const { preferences } = useAvatarPreferences();
  const { customAvatar } = useCustomAvatar();
  const [demoReviews, setDemoReviews] = useState([
    {
      reviewId: 'review-1',
      courseCode: 'CS101',
      courseName: '計算機科學導論',
      rating: 4.5,
      difficulty: 'medium' as const,
      content: '這門課程非常有趣，教授講解清晰，作業量適中。推薦給對程式設計有興趣的同學。',
      pros: ['教授很有耐心', '課程內容實用', '作業有挑戰性'],
      cons: ['考試有點難', '需要花較多時間練習'],
      semester: '2024春季',
      likes: 15,
      dislikes: 2,
      replies: 3,
      createdAt: '2024-03-15T10:30:00Z'
    },
    {
      reviewId: 'review-2',
      courseCode: 'MATH201',
      courseName: '高等數學',
      rating: 3.8,
      difficulty: 'hard' as const,
      content: '數學課程難度較高，需要大量練習。教授講解詳細，但進度較快。',
      pros: ['理論基礎扎實', '教授專業'],
      cons: ['難度較高', '進度快'],
      semester: '2024春季',
      likes: 8,
      dislikes: 5,
      replies: 1,
      createdAt: '2024-03-10T14:20:00Z'
    },
    {
      reviewId: 'review-3',
      courseCode: 'ENG102',
      courseName: '英語文學',
      rating: 4.2,
      difficulty: 'easy' as const,
      content: '很棒的文學課程，開拓了我的視野。教授鼓勵討論，課堂氣氛很好。',
      pros: ['課堂互動多', '內容有趣', '教授友善'],
      cons: ['閱讀量較大'],
      semester: '2024春季',
      likes: 12,
      dislikes: 1,
      replies: 5,
      createdAt: '2024-03-08T09:15:00Z'
    }
  ]);

  const regenerateReviews = () => {
    setDemoReviews(prev => prev.map(review => ({
      ...review,
      reviewId: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    })));
  };

  const totalCombinations = getTotalCombinations();
  const totalAnimals = getAllAnimals().length;
  const totalBackgrounds = getAllBackgrounds().length;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-4">頭像系統演示</h1>
              <p className="text-muted-foreground">請先登入以查看頭像系統功能</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <div className="max-w-6xl mx-auto pt-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">頭像系統演示</h1>
          <p className="text-muted-foreground mb-4">
            展示如何在保持匿名性的同時使用可愛的頭像系統
          </p>
          
          {/* 統計信息 */}
          <div className="flex justify-center gap-4 text-sm">
            <div className="bg-primary/10 px-3 py-1 rounded-full">
              <span className="font-medium text-primary">{totalAnimals}</span> 種動物
            </div>
            <div className="bg-secondary/50 px-3 py-1 rounded-full">
              <span className="font-medium">{totalBackgrounds}</span> 種背景
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
              <span className="font-medium text-green-600 dark:text-green-400">
                {totalCombinations.toLocaleString()}
              </span> 種組合
            </div>
          </div>
        </div>

        <Tabs defaultValue="demo" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="demo">功能演示</TabsTrigger>
            <TabsTrigger value="customizer">自定義頭像</TabsTrigger>
            <TabsTrigger value="reviews">評論展示</TabsTrigger>
            <TabsTrigger value="settings">頭像設置</TabsTrigger>
          </TabsList>

          <TabsContent value="demo" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 個人頭像展示 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    個人頭像
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    基於用戶ID生成的一致性頭像，用於個人資料和菜單
                  </p>
                  
                  <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                    <SmartAvatar
                      userId={user.$id}
                      name={user.name}
                      email={user.email}
                      customAvatar={customAvatar}
                      config={{
                        showPersonalAvatar: preferences.showPersonalAvatar,
                        showAnonymousAvatar: false,
                        size: 'lg',
                        context: 'profile'
                      }}
                      className="border-2 border-primary/20"
                    />
                    <div>
                      <p className="font-medium">{user.name || user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {customAvatar ? '自定義頭像' : 
                         preferences.showPersonalAvatar ? '系統生成頭像' : '文字模式'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {['sm', 'md', 'lg'].map(size => (
                      <div key={size} className="text-center p-2 bg-muted/30 rounded">
                        <SmartAvatar
                          userId={user.$id}
                          name={user.name}
                          email={user.email}
                          customAvatar={customAvatar}
                          config={{
                            showPersonalAvatar: preferences.showPersonalAvatar,
                            showAnonymousAvatar: false,
                            size: size as 'sm' | 'md' | 'lg',
                            context: 'profile'
                          }}
                          className="mx-auto border border-primary/20"
                        />
                        <p className="text-xs text-muted-foreground mt-1">{size}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 匿名頭像展示 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    匿名頭像
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    基於評論ID生成的匿名頭像，保持匿名性但增加視覺趣味
                  </p>
                  
                  <div className="space-y-3">
                    {['review-demo-1', 'review-demo-2', 'review-demo-3'].map((reviewId, index) => (
                      <div key={reviewId} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        {preferences.showAnonymousAvatarInReviews ? (
                          <SmartAvatar
                            reviewId={reviewId}
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
                          <p className="text-sm font-medium">匿名評論 #{index + 1}</p>
                          <p className="text-xs text-muted-foreground">
                            {preferences.showAnonymousAvatarInReviews ? '顯示匿名頭像' : '不顯示頭像'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 統計卡片 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  頭像系統統計
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {totalAnimals}
                    </div>
                    <div className="text-sm text-muted-foreground">可愛動物</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      包含哺乳動物、鳥類、海洋生物等
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {totalBackgrounds}
                    </div>
                    <div className="text-sm text-muted-foreground">背景漸變</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      溫暖、冷色、紫色、特殊漸變
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {totalCombinations.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">總組合數</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      避免重複的豐富選擇
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customizer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  自定義頭像
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  點擊下方按鈕開始自定義您的專屬頭像
                </p>
                
                <AvatarCustomizer>
                  <Button size="lg" className="gap-2">
                    <Sparkles className="h-5 w-5" />
                    開始自定義
                  </Button>
                </AvatarCustomizer>
                
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <h4 className="font-medium mb-2">自定義功能特色</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 選擇您喜愛的動物角色</li>
                    <li>• 挑選美麗的背景漸變色</li>
                    <li>• 隨機生成功能快速探索</li>
                    <li>• 雲端同步，任何設備都能使用</li>
                    <li>• 隨時可以重置為系統默認</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">評論展示</h2>
              <Button onClick={regenerateReviews} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                重新生成頭像
              </Button>
            </div>
            
            <div className="space-y-4">
              {demoReviews.map((review) => (
                <ReviewCard
                  key={review.reviewId}
                  {...review}
                  showAnonymousAvatar={preferences.showAnonymousAvatarInReviews}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <AvatarSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 