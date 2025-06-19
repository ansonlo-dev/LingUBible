import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getWordCountStatus } from '@/utils/textUtils';
import { cn } from '@/lib/utils';

interface WordCounterProps {
  text: string;
  minWords?: number;
  maxWords?: number;
  className?: string;
}

export const WordCounter: React.FC<WordCounterProps> = ({
  text,
  minWords = 5,
  maxWords = 1000,
  className
}) => {
  const { t } = useLanguage();
  const { wordCount, isValid, status, color } = getWordCountStatus(text, minWords, maxWords);

  const getDisplayText = () => {
    if (wordCount === 0) {
      return `0/${maxWords} ${t('review.wordCount.words')}`;
    }
    
    if (status === 'too-few') {
      return t('review.wordCount.tooFew', { min: minWords, current: wordCount });
    }
    
    if (status === 'too-many') {
      return t('review.wordCount.tooMany', { current: wordCount, max: maxWords });
    }
    
    return t('review.wordCount.valid', { count: wordCount });
  };

  return (
    <div className={cn('text-xs text-right mt-1', color, className)}>
      {getDisplayText()}
    </div>
  );
}; 