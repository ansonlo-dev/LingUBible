#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Components that should use ResponsiveTooltip
const componentsToCheck = [
  {
    file: 'src/components/ui/FavoriteButton.tsx',
    hasClickAction: false,
    description: 'FavoriteButton - shows add/remove from favorites tooltip'
  },
  {
    file: 'src/components/ui/GradeBadge.tsx',
    hasClickAction: false,
    description: 'GradeBadge - shows grade details tooltip'
  },
  {
    file: 'src/components/features/reviews/PopularItemCard.tsx',
    hasClickAction: true,
    description: 'PopularItemCard - department, teaching language, and teaching status badges with click actions'
  },
  {
    file: 'src/components/features/reviews/CourseReviewsList.tsx',
    hasClickAction: true,
    description: 'CourseReviewsList - requirement badges with click actions'
  },
  {
    file: 'src/components/layout/Footer.tsx',
    hasClickAction: false,
    description: 'Footer - MIT license and GitHub links'
  },
  {
    file: 'src/components/ui/star-rating.tsx',
    hasClickAction: false,
    description: 'StarRating - rating details tooltip (uses ResponsiveTooltip for mobile)'
  }
];

console.log('Checking mobile tooltip implementation...\n');

componentsToCheck.forEach(component => {
  const filePath = path.join(process.cwd(), component.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${component.file}`);
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if ResponsiveTooltip is imported
  const hasImport = content.includes("from '@/components/ui/responsive-tooltip'") ||
                    content.includes('from "./responsive-tooltip"');
  
  // Check if ResponsiveTooltip is used
  const hasUsage = content.includes('<ResponsiveTooltip');
  
  // Check if hasClickAction is properly set
  const hasClickActionProp = content.includes('hasClickAction={true}') || 
                             content.includes('hasClickAction={');
  
  // Check if clickActionText is set when needed
  const hasClickActionText = content.includes('clickActionText=');
  
  console.log(`📋 ${component.description}`);
  console.log(`   File: ${component.file}`);
  console.log(`   ✅ Import: ${hasImport ? 'Yes' : 'No'}`);
  console.log(`   ✅ Usage: ${hasUsage ? 'Yes' : 'No'}`);
  
  if (component.hasClickAction) {
    console.log(`   ✅ hasClickAction prop: ${hasClickActionProp ? 'Yes' : 'No'}`);
    console.log(`   ✅ clickActionText prop: ${hasClickActionText ? 'Yes' : 'No'}`);
  }
  
  console.log('');
});

// Check translations
console.log('Checking translations...\n');

const localeFiles = ['en.ts', 'zh-TW.ts', 'zh-CN.ts'];
const requiredTranslations = [
  'tooltip.clickAgainToActivate',
  'tooltip.clickAgainToFilter',
  'tooltip.clickAgainToApply'
];

localeFiles.forEach(locale => {
  const localePath = path.join(process.cwd(), 'src/locales', locale);
  
  if (!fs.existsSync(localePath)) {
    console.log(`❌ Locale file not found: ${locale}`);
    return;
  }
  
  const content = fs.readFileSync(localePath, 'utf8');
  
  console.log(`📝 Locale: ${locale}`);
  requiredTranslations.forEach(key => {
    const hasTranslation = content.includes(`'${key}':`);
    console.log(`   ${hasTranslation ? '✅' : '❌'} ${key}`);
  });
  console.log('');
});

console.log('Mobile tooltip implementation check complete!');