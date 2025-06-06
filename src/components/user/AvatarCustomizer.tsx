import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { SmartAvatar } from '@/components/ui/smart-avatar';
import { useCustomAvatar } from '@/hooks/useCustomAvatar';
import { getAllAnimals, getAllBackgrounds, getTotalCombinations } from "@/utils/ui/avatarUtils";
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Palette, Shuffle, Save, Trash2, Sparkles } from 'lucide-react';
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

  const animals = getAllAnimals();
  const backgrounds = getAllBackgrounds();
  const totalCombinations = getTotalCombinations();

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
      <DialogContent className="max-w-none max-h-none w-screen h-screen sm:w-[95vw] sm:h-[95vh] sm:max-w-4xl bg-white dark:bg-gray-900 shadow-xl sm:rounded-2xl border-0 sm:border p-0 overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
        <div className="flex flex-col h-full min-h-0 avatar-customizer-content">
          <DialogHeader className="flex-shrink-0 p-4 sm:p-6 pb-3">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <Palette className="h-5 w-5 text-primary" />
              {t('avatar.customize')}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 sm:p-6 pb-0">
              <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
                {/* 預覽區域 */}
                <div className="flex items-center justify-center p-5 bg-gradient-to-br from-muted/30 to-muted/60 rounded-xl">
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
                      className="mx-auto w-20 h-20 sm:w-24 sm:h-24"
                    />
                    <div>
                      <p className="font-semibold text-foreground">{t('avatar.preview')}</p>
                      <p className="text-sm text-muted-foreground">
                        {getAnimalName(selectedAnimal)}+{t(backgrounds[selectedBackgroundIndex]?.name)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 操作按鈕 */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button onClick={randomize} variant="outline" size="sm" className="h-9">
                    <Shuffle className="h-4 w-4 mr-2" />
                    {t('avatar.randomize')}
                  </Button>
                  <Button onClick={handleSave} disabled={isLoading} size="sm" className="h-9">
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? t('avatar.saving') : t('avatar.save')}
                  </Button>
                </div>

                {/* 選項卡 */}
                <div className="flex space-x-1 bg-muted/50 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('animals')}
                    className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeTab === 'animals'
                        ? 'bg-white dark:bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-background/50'
                    }`}
                  >
                    <Sparkles className="h-4 w-4 inline mr-2" />
                    {t('avatar.animals')} ({animals.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('backgrounds')}
                    className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                      activeTab === 'backgrounds'
                        ? 'bg-white dark:bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-background/50'
                    }`}
                  >
                    <Palette className="h-4 w-4 inline mr-2" />
                    {t('avatar.backgrounds')} ({backgrounds.length})
                  </button>
                </div>
              </div>
            </div>

            {/* 可滾動的選擇區域 */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 pb-4 sm:pb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="max-w-4xl mx-auto">
                <div className="bg-muted/20 rounded-xl p-3 sm:p-4">
                {activeTab === 'animals' ? (
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2 sm:gap-3">
                    {animals.map((animal, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedAnimal(animal)}
                        className={`
                          aspect-square rounded-lg transition-all duration-200 hover:scale-110
                          flex items-center justify-center text-lg sm:text-xl md:text-2xl
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
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                    {backgrounds.map((bg, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedBackgroundIndex(index)}
                        className={`
                          aspect-square rounded-lg transition-all duration-200 hover:scale-105 relative overflow-hidden
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
                          <div className="absolute bottom-1 left-1 right-1">
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
        </div>
      </DialogContent>
    </Dialog>
  );
} 