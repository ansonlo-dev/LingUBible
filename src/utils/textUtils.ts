/**
 * Count words in a text string
 * @param text - The text to count words in
 * @returns Number of words
 */
export const countWords = (text: string): number => {
  if (!text || !text.trim()) {
    return 0;
  }
  
  // Remove extra whitespace and split by whitespace
  // This handles multiple spaces, tabs, and newlines
  const words = text.trim().split(/\s+/);
  return words.length;
};

/**
 * Validate word count for text input
 * @param text - The text to validate
 * @param minWords - Minimum required words (default: 5)
 * @param maxWords - Maximum allowed words (default: 1000)
 * @returns Object with validation result and message
 */
export const validateWordCount = (
  text: string, 
  minWords: number = 5, 
  maxWords: number = 1000
): { isValid: boolean; wordCount: number; message?: string } => {
  const wordCount = countWords(text);
  
  if (wordCount < minWords) {
    return {
      isValid: false,
      wordCount,
      message: `At least ${minWords} words required (${wordCount}/${minWords})`
    };
  }
  
  if (wordCount > maxWords) {
    return {
      isValid: false,
      wordCount,
      message: `Too many words (${wordCount}/${maxWords})`
    };
  }
  
  return {
    isValid: true,
    wordCount
  };
};

/**
 * Get word count status for display
 * @param text - The text to check
 * @param minWords - Minimum required words
 * @param maxWords - Maximum allowed words
 * @returns Object with display information
 */
export const getWordCountStatus = (
  text: string,
  minWords: number = 5,
  maxWords: number = 1000
): {
  wordCount: number;
  isValid: boolean;
  status: 'too-few' | 'valid' | 'too-many';
  color: 'text-red-500' | 'text-green-600' | 'text-orange-500' | 'text-gray-500';
} => {
  const wordCount = countWords(text);
  
  if (wordCount === 0) {
    return {
      wordCount,
      isValid: false,
      status: 'too-few',
      color: 'text-gray-500'
    };
  }
  
  if (wordCount < minWords) {
    return {
      wordCount,
      isValid: false,
      status: 'too-few',
      color: 'text-red-500'
    };
  }
  
  if (wordCount > maxWords) {
    return {
      wordCount,
      isValid: false,
      status: 'too-many',
      color: 'text-red-500'
    };
  }
  
  return {
    wordCount,
    isValid: true,
    status: 'valid',
    color: 'text-green-600'
  };
}; 