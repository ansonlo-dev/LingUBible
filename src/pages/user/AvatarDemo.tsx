import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AvatarSettings } from "@/components/user/AvatarSettings";
import { AvatarCustomizer } from "@/components/user/AvatarCustomizer";
import { ReviewCard } from "@/components/features/reviews/ReviewCard";
import { SmartAvatar } from '@/components/ui/smart-avatar';
import { useAvatarPreferences } from '@/hooks/useAvatarPreferences';
import { useCustomAvatar } from '@/hooks/useCustomAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Users, MessageSquare, Palette, Sparkles, BarChart3, Shuffle, Grid3X3 } from 'lucide-react';
import { 
  getTotalCombinations, 
  getAllAnimals, 
  getAllBackgrounds,
  getRandomAvatarCombination,
  getAllAvatarCombinations,
  getShuffledAvatarCombinations
} from "@/utils/ui/avatarUtils";

export default function AvatarDemo() {
  const { user } = useAuth();
  const { preferences } = useAvatarPreferences();
  const { customAvatar, isInitialLoading } = useCustomAvatar();
  const [randomCombinations, setRandomCombinations] = useState<Array<{ animal: string; background: any; animalIndex: number; backgroundIndex: number }>>([]);
  const [showingAllCombinations, setShowingAllCombinations] = useState(false);
  const [demoReviews, setDemoReviews] = useState([
    {
      reviewId: 'demo-review-1',
      courseCode: 'CS101',
      courseName: '計算機科學導論',
      rating: 4.5,
      difficulty: 'medium' as const,
      content: '這門課程內容豐富，教授講解清晰，作業量適中。推薦給對這個領域有興趣的同學。',
      pros: ['教授講解清晰', '課程內容實用', '作業量適中'],
      cons: ['考試有點難'],
      semester: '2024春季',
      likes: 12,
      dislikes: 2,
      replies: 3,
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      reviewId: 'demo-review-2',
      courseCode: 'MATH201', 
      courseName: '高等數學',
      rating: 3.8,
      difficulty: 'hard' as const,
      content: '課程難度較高，需要投入較多時間學習。但是學到的知識很實用，對未來發展有幫助。',
      pros: ['知識實用', '對未來有幫助'],
      cons: ['難度較高', '需要較多時間'],
      semester: '2024春季',
      likes: 8,
      dislikes: 1,
      replies: 1,
      createdAt: '2024-01-10T14:20:00Z'
    },
    {
      reviewId: 'demo-review-3',
      courseCode: 'ENG102',
      courseName: '英語文學',
      rating: 4.2,
      difficulty: 'easy' as const, 
      content: '入門級課程，適合初學者。教授很有耐心，會重複講解重要概念。',
      pros: ['適合初學者', '教授有耐心', '重複講解重要概念'],
      cons: ['閱讀量較大'],
      semester: '2024春季',
      likes: 15,
      dislikes: 0,
      replies: 5,
      createdAt: '2024-01-08T09:15:00Z'
    }
  ]);

  const totalAnimals = getAllAnimals().length;
  const totalBackgrounds = getAllBackgrounds().length;
  const totalCombinations = getTotalCombinations();

  // 生成隨機組合
  const generateRandomCombinations = (count: number = 20) => {
    const combinations = [];
    for (let i = 0; i < count; i++) {
      combinations.push(getRandomAvatarCombination());
    }
    setRandomCombinations(combinations);
  };

  // 顯示所有組合（前100個）
  const showAllCombinations = () => {
    const allCombinations = getAllAvatarCombinations(0, 100);
    setRandomCombinations(allCombinations);
    setShowingAllCombinations(true);
  };

  // 隨機打亂所有組合（前50個）
  const shuffleAllCombinations = () => {
    const shuffled = getShuffledAvatarCombinations().slice(0, 50);
    setRandomCombinations(shuffled);
    setShowingAllCombinations(false);
  };

  // 重新生成評論頭像
  const regenerateReviews = () => {
    setDemoReviews(prev => prev.map(review => ({
      ...review,
      reviewId: `demo-review-${Date.now()}-${Math.random()}`
    })));
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">頭像系統演示</h1>
          <p className="text-muted-foreground">請先登入以查看頭像功能</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">頭像系統演示</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          探索我們的智能頭像系統，包含個人頭像、匿名頭像和自定義功能
        </p>
      </div>

      <Tabs defaultValue="demo" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="demo">頭像展示</TabsTrigger>
          <TabsTrigger value="customizer">自定義頭像</TabsTrigger>
          <TabsTrigger value="combinations">隨機組合</TabsTrigger>
          <TabsTrigger value="reviews">評論演示</TabsTrigger>
          <TabsTrigger value="settings">設置</TabsTrigger>
        </TabsList>

        <TabsContent value="demo" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    isLoading={isInitialLoading}
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
                        isLoading={isInitialLoading}
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

        <TabsContent value="combinations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                隨機頭像組合生成器
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                探索所有 {totalCombinations.toLocaleString()} 種頭像組合的可能性
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => generateRandomCombinations(20)} variant="outline">
                  <Shuffle className="h-4 w-4 mr-2" />
                  生成 20 個隨機組合
                </Button>
                <Button onClick={() => generateRandomCombinations(50)} variant="outline">
                  <Sparkles className="h-4 w-4 mr-2" />
                  生成 50 個隨機組合
                </Button>
                <Button onClick={showAllCombinations} variant="outline">
                  <Grid3X3 className="h-4 w-4 mr-2" />
                  顯示前 100 個組合
                </Button>
                <Button onClick={shuffleAllCombinations} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  隨機打亂 50 個組合
                </Button>
              </div>

              {randomCombinations.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">
                      {showingAllCombinations ? '前 100 個組合' : `隨機生成的 ${randomCombinations.length} 個組合`}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      點擊任意頭像查看詳細信息
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
                    {randomCombinations.map((combo, index) => (
                      <div key={index} className="text-center space-y-2">
                        <div 
                          className={`
                            w-12 h-12 mx-auto rounded-full flex items-center justify-center text-xl
                            bg-gradient-to-br ${combo.background.light} dark:${combo.background.dark}
                            hover:scale-110 transition-transform duration-200 cursor-pointer
                            border-2 border-transparent hover:border-primary/50
                          `}
                          title={`${combo.animal} + ${combo.background.name}`}
                        >
                          {combo.animal}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          #{combo.animalIndex + 1}-{combo.backgroundIndex + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
  );
} 