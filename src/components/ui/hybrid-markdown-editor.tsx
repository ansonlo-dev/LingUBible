import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  List, 
  ListOrdered,
  Eye,
  Edit3
} from 'lucide-react';
import { renderCommentMarkdown, hasMarkdownFormatting } from '@/utils/ui/markdownRenderer';

interface HybridMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  id?: string;
  minWords?: number;
  maxWords?: number;
  disabled?: boolean;
  t?: (key: string) => string;
}

export const HybridMarkdownEditor: React.FC<HybridMarkdownEditorProps> = ({
  value,
  onChange,
  placeholder,
  rows = 4,
  className,
  id,
  minWords = 0,
  maxWords,
  disabled = false,
  t = (key: string) => key, // Default fallback function
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-switch to preview mode when not focused and has content
  useEffect(() => {
    if (!isFocused && value.trim() && hasMarkdownFormatting(value)) {
      const timer = setTimeout(() => setIsPreviewMode(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isFocused, value]);

  const insertMarkdown = useCallback((before: string, after: string = '') => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newValue = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newValue);
    
    // Set cursor position after markdown insertion
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [value, onChange]);

  const formatActions = [
    { icon: Bold, action: () => insertMarkdown('**', '**'), title: 'Bold' },
    { icon: Italic, action: () => insertMarkdown('*', '*'), title: 'Italic' },
    { icon: Underline, action: () => insertMarkdown('__', '__'), title: 'Underline' },
    { icon: Strikethrough, action: () => insertMarkdown('~~', '~~'), title: 'Strikethrough' },
    { icon: List, action: () => insertMarkdown('\n- ', ''), title: 'Bullet List' },
    { icon: ListOrdered, action: () => insertMarkdown('\n1. ', ''), title: 'Numbered List' },
  ];

  const handleFocus = () => {
    setIsFocused(true);
    setIsPreviewMode(false);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const toggleMode = () => {
    setIsPreviewMode(!isPreviewMode);
    if (!isPreviewMode) {
      // Switching to edit mode
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const wordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;
  const isOverMaxWords = maxWords && wordCount > maxWords;
  const isUnderMinWords = minWords > 0 && wordCount < minWords;

  return (
    <div className={cn("relative", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-muted/20 dark:bg-muted/10 border border-border rounded-t-lg">
        <div className="flex flex-wrap gap-1">
          {formatActions.map(({ icon: Icon, action, title }) => (
            <Button
              key={title}
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-muted"
              onClick={action}
              disabled={disabled || isPreviewMode}
              title={title}
            >
              <Icon className="h-3 w-3" />
            </Button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Mode Toggle */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={toggleMode}
            disabled={disabled}
          >
            {isPreviewMode ? (
              <>
                <Edit3 className="h-3 w-3 mr-1" />
                {t('review.edit')}
              </>
            ) : (
              <>
                <Eye className="h-3 w-3 mr-1" />
                {t('review.preview')}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor/Preview Area */}
      <div className="relative min-h-[100px]">
        {isPreviewMode && value.trim() ? (
          /* Preview Mode */
          <div 
            className={cn(
              "border border-t-0 rounded-b-lg p-3 bg-background min-h-[100px] cursor-text",
              "border-border focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            )}
            onClick={() => toggleMode()}
          >
            {hasMarkdownFormatting(value) ? (
              <div className="text-sm prose prose-sm max-w-none dark:prose-invert">
                {renderCommentMarkdown(value)}
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{value}</p>
            )}
            
            {/* Preview Mode Indicator */}
            <div className="absolute top-2 right-2 opacity-60">
              <Eye className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <Textarea
            ref={textareaRef}
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="rounded-t-none border-t-0 resize-y focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onFocus={handleFocus}
            onBlur={handleBlur}
            disabled={disabled}
          />
        )}
      </div>

      {/* Word Counter */}
      {(minWords > 0 || maxWords) && (
        <div className={cn(
          "text-xs mt-1 flex justify-between items-center",
          isOverMaxWords && "text-destructive",
          isUnderMinWords && "text-orange-500"
        )}>
          <span>
            {wordCount} {t('review.wordCount.words')}
            {minWords > 0 && ` (${t('common.min')}: ${minWords})`}
            {maxWords && ` (${t('common.max')}: ${maxWords})`}
          </span>
          {isOverMaxWords && (
            <span className="text-destructive font-medium">
              {wordCount - maxWords} {t('review.wordCount.wordsOverLimit')}
            </span>
          )}
          {isUnderMinWords && (
            <span className="text-orange-500 font-medium">
              {minWords - wordCount} {t('review.wordCount.moreWordsNeeded')}
            </span>
          )}
        </div>
      )}
    </div>
  );
};