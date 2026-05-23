#!/usr/bin/env node

/**
 * Script to update title attributes to use ResponsiveTooltip
 * This script identifies common patterns and provides replacement suggestions
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const filesToUpdate = [
  'src/components/common/OpenStatusWidget.tsx',
  'src/components/common/KofiWidget.tsx',
  'src/pages/Index.tsx',
  'src/components/dev/PerformanceDashboard.tsx',
  'src/components/ui/CollapsibleSection.tsx',
  'src/components/ui/sidebar.tsx',
  'src/components/ui/multi-select-dropdown.tsx',
  'src/components/ui/PersistentCollapsibleSection.tsx',
  'src/pages/PerformanceTest.tsx',
  'src/pages/EmailPreview.tsx',
  'src/pages/Favorites.tsx',
  'src/pages/CourseDetail.tsx',
  'src/components/user/AvatarCustomizer.tsx',
  'src/pages/Courses.tsx',
  'src/components/user/UserMenu.tsx',
  'src/pages/user/MyReviews.tsx',
  'src/components/layout/Header.tsx',
  'src/pages/Lecturers.tsx',
  'src/components/layout/Footer.tsx',
  'src/components/features/reviews/CourseRequirementsFilter.tsx',
  'src/components/layout/AppSidebar.tsx',
  'src/components/features/reviews/CourseReviewsList.tsx',
  'src/components/features/reviews/ReviewSubmissionForm.tsx',
];

const patterns = [
  {
    // Simple title attribute pattern
    pattern: /title=\{([^}]+)\}/g,
    replacement: (match, content) => {
      return `// TODO: Replace with ResponsiveTooltip - title={${content}}`;
    }
  },
  {
    // String title attribute pattern
    pattern: /title="([^"]+)"/g,
    replacement: (match, content) => {
      return `// TODO: Replace with ResponsiveTooltip - title="${content}"`;
    }
  }
];

function updateFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let hasChanges = false;

  // Count title attributes
  const titleMatches = content.match(/title=/g);
  if (titleMatches) {
    console.log(`\n📄 ${filePath} - Found ${titleMatches.length} title attributes`);
    
    // Show the lines with title attributes
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (line.includes('title=')) {
        console.log(`  Line ${index + 1}: ${line.trim()}`);
      }
    });
  }
}

function checkImports(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return content.includes('ResponsiveTooltip');
}

function generateUpdateInstructions() {
  console.log('🔄 Tooltip Update Analysis\n');
  console.log('Files that need ResponsiveTooltip imports:');
  
  filesToUpdate.forEach(file => {
    const hasImport = checkImports(file);
    const hasTitle = fs.existsSync(file) && fs.readFileSync(file, 'utf-8').includes('title=');
    
    if (hasTitle && !hasImport) {
      console.log(`  ❌ ${file} - Needs import`);
    } else if (hasTitle && hasImport) {
      console.log(`  ✅ ${file} - Has import`);
    } else if (!hasTitle) {
      console.log(`  ➖ ${file} - No tooltips`);
    }
  });

  console.log('\n📋 Manual Update Instructions:');
  console.log('1. Add import: import { ResponsiveTooltip } from "@/components/ui/responsive-tooltip";');
  console.log('2. Replace title="text" with <ResponsiveTooltip content="text">');
  console.log('3. Replace title={expression} with <ResponsiveTooltip content={expression}>');
  console.log('4. Wrap the target element with the ResponsiveTooltip component');
  console.log('5. Remove the title attribute');
  
  filesToUpdate.forEach(updateFile);
}

function main() {
  console.log('🚀 Starting tooltip update analysis...\n');
  generateUpdateInstructions();
  console.log('\n✨ Analysis complete! Use the information above to manually update the files.');
}

if (require.main === module) {
  main();
}

module.exports = { updateFile, checkImports, generateUpdateInstructions }; 