import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/hooks/useLanguage';
import { getGradeInfo } from '@/utils/gradeUtils';

interface GradeBadgeProps {
  grade: string;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  onClick?: () => void;
}

export const GradeBadge: React.FC<GradeBadgeProps> = ({ 
  grade, 
  size = 'md', 
  showTooltip = true,
  onClick 
}) => {
  const { t } = useLanguage();
  
  // Handle N/A grades (stored as "-1")
  const isNotApplicable = grade === '-1';
  
  // If it's N/A, use translated text; otherwise get grade info
  const gradeInfo = isNotApplicable ? null : getGradeInfo(grade);
  
  // Display logic: Always use "N/A" for display (fits in circle), but translated text for tooltips
  const displayGrade = isNotApplicable 
    ? 'N/A'
    : gradeInfo?.grade || grade || 'N/A';
    
  const displayGpa = isNotApplicable ? 0 : (gradeInfo?.gpa ?? 0);
  const displayDescription = isNotApplicable 
    ? 'Not Applicable' 
    : (gradeInfo?.description || 'Unknown');

  const getLocalizedDescription = (description: string) => {
    const descriptionMap: Record<string, string> = {
      'Excellent': t('grade.description.excellent'),
      'Good': t('grade.description.good'),
      'Fair': t('grade.description.fair'),
      'Pass': t('grade.description.pass'),
      'Failure': t('grade.description.failure'),
      'Incomplete': t('grade.description.incomplete'),
      'Merit': t('grade.description.merit'),
      'Very Satisfactory': t('grade.description.verySatisfactory'),
      'Satisfactory': t('grade.description.satisfactory'),
      'Unsatisfactory': t('grade.description.unsatisfactory'),
      'Withdrawn': t('grade.description.withdrawn'),
      'Audit': t('grade.description.audit'),
      'Not Applicable': t('review.notApplicable'),
      'Unknown': t('grade.description.unknown') || 'Unknown'
    };
    return descriptionMap[description] || description;
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  const getGradeStyleClasses = (grade: string, gpa: number, isNA: boolean) => {
    // 處理 N/A 成績
    if (isNA || !grade || grade.toLowerCase() === 'n/a' || grade.trim() === '' || displayGrade === 'N/A') {
      return `
        bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600
        dark:from-gray-500 dark:via-gray-600 dark:to-gray-700
        text-white dark:text-gray-200
        border-2 border-gray-500/30 dark:border-gray-600/40
        shadow-lg shadow-gray-500/25 dark:shadow-gray-600/20
        hover:shadow-xl hover:shadow-gray-500/35 dark:hover:shadow-gray-600/30
        hover:scale-105
        ring-2 ring-gray-500/20 dark:ring-gray-600/30
      `;
    }

    // 基於成績字母的顏色系統
    const firstLetter = grade.charAt(0).toUpperCase();
    
    if (firstLetter === 'A') {
      // A, A- - 綠色漸變
      return `
        bg-gradient-to-br from-emerald-400 via-emerald-500 to-green-500
        dark:from-emerald-300 dark:via-emerald-400 dark:to-green-400
        text-white dark:text-emerald-900
        border-2 border-emerald-500/30 dark:border-emerald-400/40
        shadow-lg shadow-emerald-500/25 dark:shadow-emerald-400/20
        hover:shadow-xl hover:shadow-emerald-500/35 dark:hover:shadow-emerald-400/30
        hover:scale-105
        ring-2 ring-emerald-500/20 dark:ring-emerald-400/30
      `;
    } else if (firstLetter === 'B') {
      // B+, B, B- - 藍色漸變
      return `
        bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600
        dark:from-blue-300 dark:via-blue-400 dark:to-blue-500
        text-white dark:text-blue-900
        border-2 border-blue-500/30 dark:border-blue-400/40
        shadow-lg shadow-blue-500/25 dark:shadow-blue-400/20
        hover:shadow-xl hover:shadow-blue-500/35 dark:hover:shadow-blue-400/30
        hover:scale-105
        ring-2 ring-blue-500/20 dark:ring-blue-400/30
      `;
    } else if (firstLetter === 'C') {
      // C+, C, C- - 黃色漸變
      return `
        bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500
        dark:from-yellow-300 dark:via-yellow-400 dark:to-amber-400
        text-white dark:text-yellow-900
        border-2 border-yellow-500/30 dark:border-yellow-400/40
        shadow-lg shadow-yellow-500/25 dark:shadow-yellow-400/20
        hover:shadow-xl hover:shadow-yellow-500/35 dark:hover:shadow-yellow-400/30
        hover:scale-105
        ring-2 ring-yellow-500/20 dark:ring-yellow-400/30
      `;
    } else if (firstLetter === 'D') {
      // D+, D - 橙色漸變
      return `
        bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600
        dark:from-orange-300 dark:via-orange-400 dark:to-orange-500
        text-white dark:text-orange-900
        border-2 border-orange-500/30 dark:border-orange-400/40
        shadow-lg shadow-orange-500/25 dark:shadow-orange-400/20
        hover:shadow-xl hover:shadow-orange-500/35 dark:hover:shadow-orange-400/30
        hover:scale-105
        ring-2 ring-orange-500/20 dark:ring-orange-400/30
      `;
    } else if (firstLetter === 'F') {
      // F - 紅色漸變
      return `
        bg-gradient-to-br from-red-500 via-red-600 to-red-700
        dark:from-red-400 dark:via-red-500 dark:to-red-600
        text-white dark:text-red-900
        border-2 border-red-600/40 dark:border-red-500/50
        shadow-lg shadow-red-500/30 dark:shadow-red-400/25
        hover:shadow-xl hover:shadow-red-500/40 dark:hover:shadow-red-400/35
        hover:scale-105
        ring-2 ring-red-500/25 dark:ring-red-400/35
      `;
    } else {
      // 其他未知成績 - 灰色
      return `
        bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600
        dark:from-gray-500 dark:via-gray-600 dark:to-gray-700
        text-white dark:text-gray-200
        border-2 border-gray-500/30 dark:border-gray-600/40
        shadow-lg shadow-gray-500/25 dark:shadow-gray-600/20
        hover:shadow-xl hover:shadow-gray-500/35 dark:hover:shadow-gray-600/30
        hover:scale-105
        ring-2 ring-gray-500/20 dark:ring-gray-600/30
      `;
    }
  };

  const getTooltipText = () => {
    if (!showTooltip) return undefined;
    
    // Special tooltip for N/A grades
    if (isNotApplicable) {
      return `${t('review.finalGrade')}: ${t('review.notApplicable')} | ${t('review.gradeNotApplicable')}`;
    }
    
    return `${t('review.finalGrade')}: ${displayGrade} | ${t('grade.gpa')}: ${displayGpa.toFixed(2)} | ${getLocalizedDescription(displayDescription)}`;
  };

  const badgeElement = (
    <div className="mb-2">
      <div 
        className={`
          ${sizeClasses[size]} 
          ${getGradeStyleClasses(displayGrade, displayGpa, isNotApplicable)}
          font-black 
          text-center
          rounded-full
          transition-all duration-300 ease-in-out
          transform
          flex items-center justify-center
          backdrop-blur-sm
          ${showTooltip ? 'cursor-help' : ''}
          ${onClick ? 'cursor-pointer hover:scale-110' : ''}
        `}
        title={getTooltipText()}
        onClick={onClick ? (e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        } : undefined}
      >
        {displayGrade}
      </div>
    </div>
  );

  return badgeElement;
}; 