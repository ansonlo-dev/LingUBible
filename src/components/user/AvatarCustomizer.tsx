import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { SmartAvatar } from '@/components/ui/smart-avatar';
import { useCustomAvatar } from '@/hooks/useCustomAvatar';
import { getAllAnimals, getAllBackgrounds, getTotalCombinations } from "@/utils/ui/avatarUtils";
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { Palette, Shuffle, Save, Trash2, Sparkles, Radius } from 'lucide-react';
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

  const animals = getAllAnimals();
  const backgrounds = getAllBackgrounds();
  const totalCombinations = getTotalCombinations();

  // 檢測螢幕方向
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight && window.innerWidth <= 1024);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
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

  // 隨機選擇
  const randomize = () => {
    const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
    const randomBackground = Math.floor(Math.random() * backgrounds.length);
    setSelectedAnimal(randomAnimal);
    setSelectedBackgroundIndex(randomBackground);
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
      setIsOpen(false);
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
      setIsOpen(false);
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
          ? 'fixed inset-0 max-w-none max-h-none w-screen h-screen translate-x-0 translate-y-0 left-0 top-0' 
          : 'max-w-none max-h-none w-screen h-screen sm:w-[95vw] sm:h-[95vh] sm:max-w-4xl'
        } 
        bg-white dark:bg-gray-900 shadow-xl 
        ${!isLandscape ? 'sm:rounded-2xl' : ''} 
        border-0 ${!isLandscape ? 'sm:border' : ''} 
        p-0 overflow-hidden 
        data-[state=open]:animate-in data-[state=closed]:animate-out 
        data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
      `} style={{ borderRadius: isLandscape ? '0' : undefined }}>
        <div className="flex flex-col h-full min-h-0 avatar-customizer-content">
          <DialogHeader className={`flex-shrink-0 ${isLandscape ? 'p-2 pb-1' : 'p-3 sm:p-6 pb-1'}`}>
            <DialogTitle className={`flex items-center gap-2 text-lg sm:text-xl font-bold text-foreground ${isLandscape ? 'mt-1 ml-1' : ''}`}>
              <Palette className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              {t('avatar.customize')}
            </DialogTitle>
          </DialogHeader>

          {isLandscape ? (
            // 橫屏模式：左右分割佈局
            <div className="flex-1 flex min-h-0">
              {/* 左半部：預覽和控制 */}
              <div className="w-2/5 flex flex-col p-4">
                {/* 預覽區域 */}
                <div className="flex items-center justify-center p-6 bg-gradient-to-br from-muted/30 to-muted/60 rounded-xl mb-6">
                  <div className="text-center space-y-3">
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
                      <p className="font-semibold text-foreground text-base">{t('avatar.preview')}</p>
                      <p className="text-sm text-muted-foreground">
                        {getAnimalName(selectedAnimal)}+{t(backgrounds[selectedBackgroundIndex]?.name)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 操作按鈕 - 同一行，減少寬度 */}
                <div className="flex gap-3 justify-center">
                  <Button onClick={randomize} variant="outline" size="sm" className="h-9 text-xs px-4">
                    <Shuffle className="h-3 w-3 mr-2" />
                    {t('avatar.randomize')}
                  </Button>
                  <Button onClick={handleSave} disabled={isLoading} size="sm" className="h-9 text-xs px-4">
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
                      className={`flex-1 py-2 px-3 text-xs font-medium transition-all duration-200 relative ${
                        activeTab === 'animals'
                          ? 'text-foreground font-bold'
                          : 'text-muted-foreground hover:text-foreground hover:scale-105'
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
                      className={`flex-1 py-2 px-3 text-xs font-medium transition-all duration-200 relative ${
                        activeTab === 'backgrounds'
                          ? 'text-foreground font-bold'
                          : 'text-muted-foreground hover:text-foreground hover:scale-105'
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
                  <div className="bg-muted/20 p-3">
                    {activeTab === 'animals' ? (
                      <div className="grid grid-cols-10 gap-1.5">
                        {animals.map((animal, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedAnimal(animal)}
                            className={`
                              aspect-square rounded-md transition-[transform,background-color,box-shadow] duration-200 hover:scale-110
                              flex items-center justify-center text-lg
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
                      <div className="grid grid-cols-6" style={{ gap: '10px' }}>
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
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200">
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
                      className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-medium transition-all duration-200 relative ${
                        activeTab === 'animals'
                          ? 'text-foreground font-bold'
                          : 'text-muted-foreground hover:text-foreground hover:scale-105'
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
                      className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 text-xs sm:text-sm font-medium transition-all duration-200 relative ${
                        activeTab === 'backgrounds'
                          ? 'text-foreground font-bold'
                          : 'text-muted-foreground hover:text-foreground hover:scale-105'
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
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-6 pb-3 sm:pb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="max-w-4xl mx-auto">
                  <div className="bg-muted/20 rounded-xl p-2 sm:p-4">
                  {activeTab === 'animals' ? (
                    <div className="grid grid-cols-8 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5 sm:gap-3">
                      {animals.map((animal, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedAnimal(animal)}
                          className={`
                            aspect-square rounded-lg transition-[transform,background-color,box-shadow] duration-200 hover:scale-110
                            flex items-center justify-center text-base sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl
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
                    <div className="grid grid-cols-6 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-8 xl:grid-cols-10" style={{ gap: '16px' }}>
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
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200">
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