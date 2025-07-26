import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { SmartAvatar } from '@/components/ui/smart-avatar';
import { useCustomAvatar } from '@/hooks/useCustomAvatar';
import { getAllAnimals, getAllBackgrounds, getTotalCombinations } from "@/utils/ui/avatarUtils";
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { Palette, Shuffle, Save, Trash2, Sparkles, Radius, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AvatarCustomizerProps {
  children: React.ReactNode;
}

export function AvatarCustomizer({ children }: AvatarCustomizerProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { customAvatar, saveCustomAvatar, deleteCustomAvatar, isLoading } = useCustomAvatar();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState(customAvatar?.animal || '🐱');
  const [selectedBackgroundIndex, setSelectedBackgroundIndex] = useState(customAvatar?.backgroundIndex || 0);
  const [activeTab, setActiveTab] = useState<'animals' | 'backgrounds'>('animals');
  const [isLandscape, setIsLandscape] = useState(false);
  const [viewportDimensions, setViewportDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    availableHeight: typeof window !== 'undefined' ? 
      ((window as any).visualViewport?.height || window.innerHeight) : 768
  });
  const hasAddedHistoryEntry = useRef(false);

  const animals = getAllAnimals();
  const backgrounds = getAllBackgrounds();
  const totalCombinations = getTotalCombinations();

  // 檢測螢幕方向和視窗尺寸
  useEffect(() => {
    const checkOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const visualViewport = (window as any).visualViewport;
      const availableHeight = visualViewport?.height || height;
      setIsLandscape(width > height && width <= 1024);
      setViewportDimensions({ width, height, availableHeight });
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    // 監聽 visualViewport 變化（地址欄顯示/隱藏）
    const visualViewport = (window as any).visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener('resize', checkOrientation);
    }

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      if (visualViewport) {
        visualViewport.removeEventListener('resize', checkOrientation);
      }
    };
  }, []);

  // 獲取動物名稱
  const getAnimalName = (animal: string): string => {
    return t(`animal.${animal}`) || animal;
  };

  // 當 customAvatar 變化時更新選擇的值
  useEffect(() => {
    if (customAvatar) {
      setSelectedAnimal(customAvatar.animal);
      setSelectedBackgroundIndex(customAvatar.backgroundIndex);
    }
  }, [customAvatar]);

  // 處理手機返回按鈕以避免在 PWA 中退出應用
  useEffect(() => {
    if (isOpen) {
      if (!hasAddedHistoryEntry.current) {
        window.history.pushState({ modal: 'avatar-customizer' }, '');
        hasAddedHistoryEntry.current = true;
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handlePopState = () => {
      if (isOpen) {
        setIsOpen(false);
        hasAddedHistoryEntry.current = false;
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isOpen]);

  // 隨機選擇
  const randomize = () => {
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    const randomBackground = Math.floor(Math.random() * backgrounds.length);
    setSelectedAnimal(randomAnimal);
    setSelectedBackgroundIndex(randomBackground);
  };

  // 處理關閉彈出框
  const handleClose = () => {
    if (hasAddedHistoryEntry.current) {
      // 如果當前 history state 是我們的頭像自訂模態，則通過 history.back() 關閉
      if (window.history.state && window.history.state.modal === 'avatar-customizer') {
        window.history.back();
        return; // 讓 popstate 事件處理關閉
      }
      hasAddedHistoryEntry.current = false;
    }
    setIsOpen(false);
  };

  // 保存頭像
  const handleSave = async () => {
    const success = await saveCustomAvatar(selectedAnimal, selectedBackgroundIndex);
    if (success) {
      toast({
        title: t('avatar.saveSuccess'),
        description: t('avatar.saveSuccessDesc'),
        variant: "success",
      });
      handleClose();
    } else {
      toast({
        title: t('avatar.saveFailed'),
        description: t('avatar.saveFailedDesc'),
        variant: "destructive",
      });
    }
  };

  // 刪除自定義頭像
  const handleDelete = async () => {
    const success = await deleteCustomAvatar();
    if (success) {
      toast({
        title: t('avatar.resetSuccess'),
        description: t('avatar.resetSuccessDesc'),
        variant: "success",
      });
      handleClose();
    } else {
      toast({
        title: t('avatar.deleteFailed'),
        description: t('avatar.deleteFailedDesc'),
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className={`
        ${isLandscape 
          ? 'fixed top-0 left-0 right-0 max-w-none translate-x-0 translate-y-0 h-[100dvh] support-dvh:h-[100dvh]' 
          : viewportDimensions.width < 640 
            ? 'fixed left-0 right-0 top-0 max-w-none translate-x-0 translate-y-0 w-full rounded-none h-[100dvh] support-dvh:h-[100dvh]'
            : 'max-w-none max-h-none sm:w-[95vw] sm:h-[95vh] sm:max-w-4xl'
        } 
        bg-white dark:bg-gray-900 shadow-xl 
        ${!isLandscape && viewportDimensions.width >= 640 ? 'sm:rounded-2xl' : ''} 
        border-0 ${!isLandscape && viewportDimensions.width >= 640 ? 'sm:border' : ''} 
        p-0 overflow-hidden 
        data-[state=open]:animate-in data-[state=closed]:animate-out 
        data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
        ${isLandscape || viewportDimensions.width < 640
          ? 'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95' 
          : 'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]'
        }
        [&>button]:hidden
      `} style={{ 
        borderRadius: (isLandscape || viewportDimensions.width < 640) ? '0' : undefined,
        // 如果瀏覽器不支持dvh，使用計算出的高度作為備選
        height: (typeof CSS !== 'undefined' && CSS.supports('height', '100dvh')) ? undefined : (
          (isLandscape || viewportDimensions.width < 640) 
            ? `${viewportDimensions.availableHeight}px` 
            : undefined
        ),
        width: (isLandscape || viewportDimensions.width < 640) ? '100vw' : undefined,
        top: (isLandscape || viewportDimensions.width < 640) ? '0' : undefined,
        left: (isLandscape || viewportDimensions.width < 640) ? '0' : undefined,
        right: (isLandscape || viewportDimensions.width < 640) ? '0' : undefined,
        transform: (isLandscape || viewportDimensions.width < 640) ? 'none' : undefined,
        position: (isLandscape || viewportDimensions.width < 640) ? 'fixed' : undefined
      }}>
        <div className="flex flex-col h-full min-h-0 avatar-customizer-content">
          <DialogHeader className={`flex-shrink-0 ${isLandscape ? 'p-2 pb-1' : 'p-3 sm:p-6 pb-1'} ${!isLandscape && viewportDimensions.width < 640 ? 'pt-6' : ''}`} style={{
            paddingTop: isLandscape 
              ? `${Math.max(16, (viewportDimensions.height - viewportDimensions.availableHeight) + 8)}px` 
              : undefined
          }}>
            <DialogTitle className={`flex items-center justify-between text-lg sm:text-xl font-bold text-foreground ${isLandscape ? 'mt-1 ml-1 mr-1' : ''}`}>
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                {t('avatar.customize')}
              </div>
              <button
                onClick={handleClose}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted/50 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogTitle>
          </DialogHeader>

          {isLandscape ? (
            // 橫屏模式：左右分割佈局
            <div className="flex-1 flex min-h-0">
              {/* 左半部：預覽和控制 */}
              <div className="w-2/5 flex flex-col p-4">
                {/* 預覽區域 */}
                <div className="flex items-center justify-center p-4 bg-gradient-to-br from-muted/30 to-muted/60 rounded-xl mb-3">
                  <div className="text-center space-y-1">
                    <SmartAvatar
                      userId={user.$id}
                      customAvatar={{
                        animal: selectedAnimal,
                        backgroundIndex: selectedBackgroundIndex,
                        createdAt: new Date().toISOString()
                      }}
                      config={{
                        showPersonalAvatar: true,
                        showAnonymousAvatar: false,
                        size: 'lg',
                        context: 'profile'
                      }}
                      className="mx-auto w-24 h-24 [&_span[role='img']]:text-6xl"
                    />
                    <div>
                      <p className="font-semibold text-foreground text-sm">{t('avatar.preview')}</p>
                      <p className="text-xs text-muted-foreground">
                        {getAnimalName(selectedAnimal)}+{t(backgrounds[selectedBackgroundIndex]?.name)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 操作按鈕 - 兩行顯示 */}
                <div className="flex flex-col gap-2 items-center">
                  <Button onClick={randomize} variant="outline" size="sm" className="h-9 text-xs px-4 w-32">
                    <Shuffle className="h-3 w-3 mr-2" />
                    {t('avatar.randomize')}
                  </Button>
                  <Button onClick={handleSave} disabled={isLoading} size="sm" className="h-9 text-xs px-4 w-32">
                    <Save className="h-3 w-3 mr-2" />
                    {isLoading ? t('avatar.saving') : t('avatar.save')}
                  </Button>
                </div>
              </div>

              {/* 右半部：選項卡和選擇區域 */}
              <div className="w-3/5 flex flex-col">
                {/* 選項卡 - 移到右半部頂部 */}
                <div className="flex-shrink-0">
                  <div className="flex bg-transparent relative">
                    <button
                      onClick={() => setActiveTab('animals')}
                      className={`flex-1 py-2 px-3 text-xs transition-all duration-200 relative ${
                        activeTab === 'animals'
                          ? 'text-foreground font-bold'
                          : 'text-muted-foreground font-medium hover:text-foreground hover:scale-105'
                      }`}
                    >
                      <Sparkles className="h-3 w-3 inline mr-1" />
                      {t('avatar.animals')} ({animals.length})
                      {activeTab === 'animals' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('backgrounds')}
                      className={`flex-1 py-2 px-3 text-xs transition-all duration-200 relative ${
                        activeTab === 'backgrounds'
                          ? 'text-foreground font-bold'
                          : 'text-muted-foreground font-medium hover:text-foreground hover:scale-105'
                      }`}
                    >
                      <Palette className="h-3 w-3 inline mr-1" />
                      {t('avatar.backgrounds')} ({backgrounds.length})
                      {activeTab === 'backgrounds' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 選擇區域 */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div className="bg-muted/20 p-3 pb-6">
                    {activeTab === 'animals' ? (
                      <div className="grid grid-cols-10 gap-1.5">
                        {animals.map((animal, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedAnimal(animal)}
                            className={`
                              aspect-square rounded-md transition-[transform,background-color,box-shadow] duration-200 hover:scale-110
                              flex items-center justify-center text-2xl
                              ${selectedAnimal === animal 
                                ? 'bg-primary/20 ring-2 ring-primary scale-105' 
                                : 'bg-white/80 dark:bg-background/80 hover:bg-white dark:hover:bg-background'
                              }
                            `}
                            title={getAnimalName(animal)}
                          >
                            {animal}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-10 gap-2">
                        {backgrounds.map((bg, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedBackgroundIndex(index)}
                            className={`
                              aspect-square rounded-lg transition-[transform,box-shadow,opacity] duration-200 hover:scale-105 relative overflow-hidden
                              ${selectedBackgroundIndex === index 
                                ? 'ring-2 ring-primary scale-105' 
                                : 'hover:ring-1 hover:ring-primary/50'
                              }
                            `}
                          >
                            <div 
                              className={`w-full h-full bg-gradient-to-br ${bg.light}`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 hidden md:block">
                              <div className="absolute bottom-0.5 left-0.5 right-0.5">
                                <p className="text-xs text-white font-medium capitalize truncate">
                                  {t(bg.name)}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // 豎屏模式：原有佈局
            <div className="flex-1 flex flex-col min-h-0">
              <div className="p-3 sm:p-6 pb-0">
                <div className="space-y-3 sm:space-y-6 max-w-4xl mx-auto">
                  {/* 預覽區域 */}
                  <div className="flex items-center justify-center p-3 sm:p-5 bg-gradient-to-br from-muted/30 to-muted/60 rounded-xl">
                    <div className="text-center space-y-2 sm:space-y-3">
                      <SmartAvatar
                        userId={user.$id}
                        customAvatar={{
                          animal: selectedAnimal,
                          backgroundIndex: selectedBackgroundIndex,
                          createdAt: new Date().toISOString()
                        }}
                        config={{
                          showPersonalAvatar: true,
                          showAnonymousAvatar: false,
                          size: 'lg',
                          context: 'profile'
                        }}
                        className="mx-auto w-16 h-16 sm:w-24 sm:h-24 [&_span[role='img']]:text-4xl sm:[&_span[role='img']]:text-6xl"
                      />
                      <div>
                        <p className="font-semibold text-foreground text-sm sm:text-base">{t('avatar.preview')}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {getAnimalName(selectedAnimal)}+{t(backgrounds[selectedBackgroundIndex]?.name)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 操作按鈕 */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button onClick={randomize} variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">
                      <Shuffle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      {t('avatar.randomize')}
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading} size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">
                      <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      {isLoading ? t('avatar.saving') : t('avatar.save')}
                    </Button>
                  </div>

                  {/* 選項卡 */}
                  <div className="flex bg-transparent relative">
                    <button
                      onClick={() => setActiveTab('animals')}
                      className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm transition-all duration-200 relative ${
                        activeTab === 'animals'
                          ? 'text-foreground font-bold'
                          : 'text-muted-foreground font-medium hover:text-foreground hover:scale-105'
                      }`}
                    >
                      <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                      {t('avatar.animals')} ({animals.length})
                      {activeTab === 'animals' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('backgrounds')}
                      className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm transition-all duration-200 relative ${
                        activeTab === 'backgrounds'
                          ? 'text-foreground font-bold'
                          : 'text-muted-foreground font-medium hover:text-foreground hover:scale-105'
                      }`}
                    >
                      <Palette className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1 sm:mr-2" />
                      {t('avatar.backgrounds')} ({backgrounds.length})
                      {activeTab === 'backgrounds' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 可滾動的選擇區域 */}
              <div className={`flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-6 ${viewportDimensions.width < 640 ? 'pb-8' : 'pb-3 sm:pb-6'}`} style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="max-w-4xl mx-auto">
                  <div className="bg-muted/20 rounded-xl p-2 sm:p-4 mt-2 sm:mt-3">
                  {activeTab === 'animals' ? (
                    <div className="grid grid-cols-8 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5 sm:gap-3">
                      {animals.map((animal, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedAnimal(animal)}
                          className={`
                            aspect-square rounded-lg transition-[transform,background-color,box-shadow] duration-200 hover:scale-110
                            flex items-center justify-center text-2xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl
                            ${selectedAnimal === animal 
                              ? 'bg-primary/20 ring-2 ring-primary scale-105' 
                              : 'bg-white/80 dark:bg-background/80 hover:bg-white dark:hover:bg-background'
                            }
                          `}
                          title={getAnimalName(animal)}
                        >
                          {animal}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-8 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 sm:gap-2 md:gap-2 lg:gap-2">
                      {backgrounds.map((bg, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedBackgroundIndex(index)}
                          className={`
                            aspect-square rounded-lg transition-[transform,box-shadow,opacity] duration-200 hover:scale-105 relative overflow-hidden
                            ${selectedBackgroundIndex === index 
                              ? 'ring-2 ring-primary scale-105' 
                              : 'hover:ring-1 hover:ring-primary/50'
                            }
                          `}
                        >
                          <div 
                            className={`w-full h-full bg-gradient-to-br ${bg.light}`}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 hidden md:block">
                            <div className="absolute bottom-0.5 left-0.5 right-0.5 sm:bottom-1 sm:left-1 sm:right-1">
                              <p className="text-xs text-white font-medium capitalize truncate">
                                {t(bg.name)}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 