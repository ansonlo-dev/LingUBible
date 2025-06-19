import React from 'react';

/**
 * Simple markdown-like renderer for review comments
 * Handles basic formatting like bold text, bullet points, and section headers
 */
export const renderCommentMarkdown = (text: string): React.ReactNode => {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    if (!trimmedLine) {
      // Empty line - add some spacing
      elements.push(<br key={key++} />);
      continue;
    }

    // Section headers with ✓ or ✗
    if (trimmedLine.startsWith('✓') || trimmedLine.startsWith('✗')) {
      const isPositive = trimmedLine.startsWith('✓');
      const content = trimmedLine.substring(1).trim();
      
      elements.push(
        <div 
          key={key++} 
          className={`flex items-center gap-2 font-semibold mt-3 mb-2 ${
            isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}
        >
          <span className="text-lg">{isPositive ? '✓' : '✗'}</span>
          <span>{renderFormattedText(content)}</span>
        </div>
      );
      continue;
    }

    // Category headers (bold text)
    if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
      const content = trimmedLine.slice(2, -2);
      elements.push(
        <div key={key++} className="font-medium text-foreground mt-2 mb-1">
          {content}
        </div>
      );
      continue;
    }

    // Bullet points
    if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
      const content = trimmedLine.replace(/^[•-]\s*/, '');
      elements.push(
        <div key={key++} className="flex items-start gap-2 ml-4 mb-1">
          <span className="text-muted-foreground mt-1">•</span>
          <span className="text-sm text-muted-foreground flex-1">
            {renderFormattedText(content)}
          </span>
        </div>
      );
      continue;
    }

    // Regular text
    elements.push(
      <div key={key++} className="text-sm text-muted-foreground mb-1">
        {renderFormattedText(trimmedLine)}
      </div>
    );
  }

  return <div className="space-y-1">{elements}</div>;
};

/**
 * Render formatted text with Discord-style markdown support
 * Supports: **bold**, *italic*, __underline__, ~~strikethrough~~
 */
const renderFormattedText = (text: string): React.ReactNode => {
  if (!text) return text;
  
  // Split by all formatting patterns while preserving the delimiters
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|__.*?__|~~.*?~~)/);
  
  return parts.map((part, index) => {
    // Bold text (**text**)
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      const content = part.slice(2, -2);
      return <strong key={index} className="font-semibold">{renderFormattedText(content)}</strong>;
    }
    
    // Italic text (*text*) - but not if it's part of **text**
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2 && !part.startsWith('**')) {
      const content = part.slice(1, -1);
      return <em key={index} className="italic">{renderFormattedText(content)}</em>;
    }
    
    // Underline text (__text__)
    if (part.startsWith('__') && part.endsWith('__') && part.length > 4) {
      const content = part.slice(2, -2);
      return <u key={index} className="underline">{renderFormattedText(content)}</u>;
    }
    
    // Strikethrough text (~~text~~)
    if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) {
      const content = part.slice(2, -2);
      return <s key={index} className="line-through">{renderFormattedText(content)}</s>;
    }
    
    return part;
  });
};

/**
 * Check if text contains markdown-like formatting
 */
export const hasMarkdownFormatting = (text: string): boolean => {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  return (
    text.includes('✓') || 
    text.includes('✗') || 
    text.includes('**') || 
    text.includes('__') ||
    text.includes('~~') ||
    text.includes('• ') ||
    text.includes('- ') ||
    /\*[^*]+\*/.test(text) // Single asterisk for italic (but not double)
  );
}; 