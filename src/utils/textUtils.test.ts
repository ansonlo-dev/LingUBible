import { countWords, validateWordCount, getWordCountStatus } from './textUtils';

// Simple test function for word counting
export const testWordCount = () => {
  console.log('Testing word count functionality...');
  
  // Test countWords function
  console.log('countWords("hello world"):', countWords("hello world")); // Should be 2
  console.log('countWords("  hello   world  "):', countWords("  hello   world  ")); // Should be 2
  console.log('countWords(""):', countWords("")); // Should be 0
  console.log('countWords("one two three four five"):', countWords("one two three four five")); // Should be 5
  
  // Test validateWordCount function
  console.log('validateWordCount("hello world", 5, 1000):', validateWordCount("hello world", 5, 1000)); // Should be invalid (too few)
  console.log('validateWordCount("one two three four five", 5, 1000):', validateWordCount("one two three four five", 5, 1000)); // Should be valid
  
  // Test getWordCountStatus function
  console.log('getWordCountStatus("hello", 5, 1000):', getWordCountStatus("hello", 5, 1000)); // Should be too-few
  console.log('getWordCountStatus("one two three four five", 5, 1000):', getWordCountStatus("one two three four five", 5, 1000)); // Should be valid
  
  console.log('Word count tests completed!');
};

// You can call this function in the browser console to test
// testWordCount(); 