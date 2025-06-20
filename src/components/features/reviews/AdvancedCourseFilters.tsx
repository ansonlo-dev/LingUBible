import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Settings,
  X,
  Sparkles,
  BookOpen,
  Clock,
  Users,
  Globe,
  Calendar,
  GraduationCap,
  Hash,
  BookText,
  Tag,
  Building2,
  Library
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export interface CourseFilters {
  searchTerm: string;
  subjectArea: string;
  sortBy: string;
  offered: string;
  quickFilters: {
    noExam: boolean;
    easyGrading: boolean;
    lightWorkload: boolean;
    englishTaught: boolean;
    hasGroupProject: boolean;
    noAttendance: boolean;
  };
}

interface AdvancedCourseFiltersProps {
  filters: CourseFilters;
  onFiltersChange: (filters: CourseFilters) => void;
  availableSubjects: string[];
  onClearAll: () => void;
}

export function AdvancedCourseFilters({
  filters,
  onFiltersChange,
  availableSubjects,
  onClearAll
}: AdvancedCourseFiltersProps) {
  const { t } = useLanguage();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const updateFilters = (updates: Partial<CourseFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const updateQuickFilters = (key: keyof CourseFilters['quickFilters'], value: boolean) => {
    updateFilters({
      quickFilters: {
        ...filters.quickFilters,
        [key]: value
      }
    });
  };

  const hasActiveFilters = () => {
    return (
      filters.searchTerm.trim() !== '' ||
      filters.subjectArea !== 'all' ||
      filters.offered !== 'all' ||
      Object.values(filters.quickFilters).some(v => v)
    );
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.searchTerm.trim()) count++;
    if (filters.subjectArea !== 'all') count++;
    if (filters.offered !== 'all') count++;
    count += Object.values(filters.quickFilters).filter(v => v).length;
    return count;
  };

  return (
    <div className="bg-gradient-to-r from-card to-card/50 rounded-xl p-6 space-y-6">
      {/* 主要篩選區域 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 智能搜索 */}
        <div className="space-y-2">
          <label className="text-base font-medium text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {t('search.smartSearch')}
          </label>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary/70" />
            <Input
              type="text"
              placeholder={t('search.placeholder')}
              value={filters.searchTerm || ''}
              onChange={(e) => updateFilters({ searchTerm: e.target.value })}
              className="pl-12 pr-12 h-[48px] text-base bg-background/80 hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-muted rounded-lg transition-all duration-300"
            />
            {filters.searchTerm && (
              <button
                onClick={() => updateFilters({ searchTerm: '' })}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* 學科領域 */}
        <div className="space-y-2">
          <label className="text-base font-medium text-muted-foreground flex items-center gap-2">
            <Library className="h-4 w-4" />
            {t('sort.subjectArea')}
          </label>
          <Select value={filters.subjectArea} onValueChange={(value) => updateFilters({ subjectArea: value })}>
            <SelectTrigger className="bg-background hover:border-primary/30 focus:border-primary h-[48px] rounded-lg">
              <SelectValue placeholder={t('filter.allSubjects')} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border shadow-xl">
              <SelectItem value="all">
                <span className="flex items-center gap-2">
                  <Library className="h-4 w-4 text-primary" />
                  {t('filter.allSubjects')}
                </span>
              </SelectItem>
              {availableSubjects.map(subject => (
                <SelectItem key={subject} value={subject}>
                  <span className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary/70" />
                    <span className="font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">
                      {subject}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 開設狀態 */}
        <div className="space-y-2">
          <label className="text-base font-medium text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {t('filters.offeredStatus')}
          </label>
          <Select value={filters.offered} onValueChange={(value) => updateFilters({ offered: value })}>
            <SelectTrigger className="bg-background hover:border-primary/30 focus:border-primary h-[48px] rounded-lg">
              <SelectValue placeholder={t('filters.allCourses')} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border shadow-xl">
              <SelectItem value="all">{t('filters.allCourses')}</SelectItem>
              <SelectItem value="Yes">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {t('offered.yes')}
                </span>
              </SelectItem>
              <SelectItem value="No">
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {t('offered.no')}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 排序方式 */}
        <div className="space-y-2">
          <label className="text-base font-medium text-muted-foreground flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t('sort.by')}
          </label>
          <Select value={filters.sortBy} onValueChange={(value) => updateFilters({ sortBy: value })}>
            <SelectTrigger className="bg-background hover:border-primary/30 focus:border-primary h-[48px] rounded-lg">
              <SelectValue placeholder={t('sort.by')} />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border shadow-xl">
              <SelectItem value="code">
                <span className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-primary/70" />
                  {t('sort.courseCode')}
                </span>
              </SelectItem>
              <SelectItem value="title">
                <span className="flex items-center gap-2">
                  <BookText className="h-4 w-4 text-primary/70" />
                  {t('sort.courseName')}
                </span>
              </SelectItem>
              <SelectItem value="subject">
                <span className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary/70" />
                  {t('sort.subjectArea')}
                </span>
              </SelectItem>
              <SelectItem value="department">
                <span className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary/70" />
                  {t('sort.department')}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 快速篩選標籤 */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">{t('filters.quickFilters')}</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'noExam', labelKey: 'filters.noExam', icon: BookOpen },
            { key: 'easyGrading', labelKey: 'filters.easyGrading', icon: GraduationCap },
            { key: 'lightWorkload', labelKey: 'filters.lightWorkload', icon: Clock },
            { key: 'englishTaught', labelKey: 'filters.englishTaught', icon: Globe },
            { key: 'hasGroupProject', labelKey: 'filters.hasGroupProject', icon: Users },
            { key: 'noAttendance', labelKey: 'filters.noAttendance', icon: Calendar }
          ].map(({ key, labelKey, icon: Icon }) => (
            <button
              key={key}
              onClick={() => updateQuickFilters(key as keyof CourseFilters['quickFilters'], !filters.quickFilters[key as keyof CourseFilters['quickFilters']])}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                filters.quickFilters[key as keyof CourseFilters['quickFilters']]
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* 進階篩選 */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t('filters.advanced')}
            </span>
            {isAdvancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
          <div className="text-center text-muted-foreground py-8">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('filters.comingSoon')}</p>
            <p className="text-sm">{t('filters.comingSoonDesc')}</p>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* 已套用篩選和清除按鈕 */}
      {hasActiveFilters() && (
        <div className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-3">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {getActiveFiltersCount()} {t('filters.applied')}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-primary hover:text-primary/80"
          >
            {t('filters.clearAll')}
          </Button>
        </div>
      )}
    </div>
  );
} 