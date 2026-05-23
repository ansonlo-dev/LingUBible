#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Advanced Font Optimization Script
// This script creates optimized font subsets for different languages and use cases

const CONFIG = {
  sourceFont: 'public/fonts/LXGWWenKai-Regular.ttf',
  outputDir: 'public/fonts/optimized',
  tempDir: 'temp-fonts',
  
  // Character sets for different languages and use cases
  charSets: {
    // Latin characters (English, punctuation, numbers)
    latin: 'U+0020-007F,U+00A0-00FF,U+0100-017F,U+0180-024F,U+1E00-1EFF,U+2000-206F,U+2070-209F,U+20A0-20CF,U+2100-214F,U+2190-21FF',
    
    // Traditional Chinese (most common 4000+ characters)
    'zh-TW': 'U+4E00-9FFF,U+3400-4DBF,U+F900-FAFF,U+2E80-2EFF,U+31C0-31EF,U+3200-32FF,U+3300-33FF,U+FE30-FE4F,U+FF00-FFEF',
    
    // Simplified Chinese (most common 3500+ characters)  
    'zh-CN': 'U+4E00-9FFF,U+3400-4DBF,U+2E80-2EFF,U+31C0-31EF,U+3200-32FF,U+3300-33FF,U+FF00-FFEF',
    
    // Common symbols and punctuation
    symbols: 'U+2000-206F,U+2070-209F,U+20A0-20CF,U+2100-214F,U+2190-21FF,U+2200-22FF,U+2300-23FF,U+2460-24FF,U+25A0-25FF,U+2600-26FF,U+2700-27BF',
    
    // Critical subset for initial load (most common characters)
    critical: 'U+0020-007F,U+4E00-4FFF,U+5000-5FFF,U+6000-6FFF,U+7000-7FFF,U+8000-8FFF,U+9000-9FFF'
  },
  
  // Font variants to generate
  variants: [
    {
      name: 'latin',
      subset: 'latin',
      priority: 'high',
      description: 'Latin characters only (English, numbers, punctuation)'
    },
    {
      name: 'zh-TW',
      subset: 'latin,zh-TW,symbols',
      priority: 'high', 
      description: 'Traditional Chinese with Latin support'
    },
    {
      name: 'zh-CN',
      subset: 'latin,zh-CN,symbols',
      priority: 'high',
      description: 'Simplified Chinese with Latin support'
    },
    {
      name: 'critical',
      subset: 'critical',
      priority: 'critical',
      description: 'Critical subset for fast initial load'
    },
    {
      name: 'full',
      subset: 'latin,zh-TW,zh-CN,symbols',
      priority: 'low',
      description: 'Complete font with all characters'
    }
  ]
};

// Utility functions
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return Math.round(stats.size / 1024); // KB
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${Math.round(bytes / (1024 * 1024) * 10) / 10}MB`;
}

// Check if required tools are available
function checkDependencies() {
  console.log('🔍 Checking dependencies...');
  
  const tools = [
    { name: 'Python', cmd: 'python3 --version' },
    { name: 'pyftsubset', cmd: 'pyftsubset --help > /dev/null 2>&1' },
    { name: 'woff2_compress', cmd: 'which woff2_compress > /dev/null 2>&1' }
  ];
  
  for (const tool of tools) {
    try {
      execSync(tool.cmd, { stdio: 'pipe' });
      console.log(`✅ ${tool.name} is available`);
    } catch (error) {
      console.error(`❌ ${tool.name} is not available`);
      if (tool.name === 'pyftsubset') {
        console.log('📦 Install with: pip install fonttools');
      } else if (tool.name === 'woff2_compress') {
        console.log('📦 Install with: apt-get install woff2 (or brew install woff2)');
      }
      return false;
    }
  }
  
  return true;
}

// Generate font subset
function generateSubset(variant) {
  console.log(`\n🎯 Processing ${variant.name} subset...`);
  
  const unicodeRanges = variant.subset.split(',')
    .map(subset => CONFIG.charSets[subset])
    .filter(Boolean)
    .join(',');
  
  if (!unicodeRanges) {
    console.error(`❌ No unicode ranges found for ${variant.subset}`);
    return null;
  }
  
  const tempTtf = path.join(CONFIG.tempDir, `${variant.name}.ttf`);
  const outputTtf = path.join(CONFIG.outputDir, `LXGWWenKai-${variant.name}.ttf`);
  const outputWoff2 = path.join(CONFIG.outputDir, `LXGWWenKai-${variant.name}.woff2`);
  
  try {
    // Step 1: Create TTF subset
    console.log(`📝 Subsetting for ${variant.description}...`);
    const subsetCmd = [
      'pyftsubset',
      CONFIG.sourceFont,
      `--output-file=${tempTtf}`,
      `--unicodes=${unicodeRanges}`,
      '--layout-features=*',  // Keep all layout features
      '--glyph-names',        // Keep glyph names
      '--symbol-cmap',        // Keep symbol character map
      '--legacy-cmap',        // Keep legacy character map
      '--notdef-glyph',       // Keep .notdef glyph
      '--notdef-outline',     // Keep .notdef outline
      '--recommended-glyphs', // Include recommended glyphs
      '--name-legacy',        // Keep legacy name table
      '--drop-tables-=DSIG'   // Remove digital signature (reduces size)
    ].join(' ');
    
    execSync(subsetCmd, { stdio: 'pipe' });
    
    // Step 2: Copy TTF to output (for fallback)
    fs.copyFileSync(tempTtf, outputTtf);
    
    // Step 3: Convert to WOFF2
    console.log(`🗜️ Converting to WOFF2...`);
    const woff2Cmd = `woff2_compress ${tempTtf}`;
    execSync(woff2Cmd, { stdio: 'pipe' });
    
    // Move WOFF2 to output directory
    const tempWoff2 = tempTtf.replace('.ttf', '.woff2');
    fs.copyFileSync(tempWoff2, outputWoff2);
    
    // Get file sizes
    const originalSize = getFileSize(CONFIG.sourceFont);
    const ttfSize = getFileSize(outputTtf);
    const woff2Size = getFileSize(outputWoff2);
    
    const reduction = Math.round((1 - woff2Size / originalSize) * 100);
    
    console.log(`✅ ${variant.name} complete:`);
    console.log(`   📊 Original: ${formatSize(originalSize * 1024)}`);
    console.log(`   📊 TTF: ${formatSize(ttfSize * 1024)} (${Math.round((1 - ttfSize / originalSize) * 100)}% smaller)`);
    console.log(`   📊 WOFF2: ${formatSize(woff2Size * 1024)} (${reduction}% smaller)`);
    
    return {
      name: variant.name,
      priority: variant.priority,
      description: variant.description,
      files: {
        ttf: outputTtf,
        woff2: outputWoff2
      },
      sizes: {
        original: originalSize,
        ttf: ttfSize,
        woff2: woff2Size
      },
      reduction
    };
    
  } catch (error) {
    console.error(`❌ Failed to process ${variant.name}:`, error.message);
    return null;
  }
}

// Generate font manifest
function generateManifest(results) {
  const manifest = {
    generated: new Date().toISOString(),
    source: CONFIG.sourceFont,
    variants: results.filter(Boolean).map(result => ({
      name: result.name,
      priority: result.priority,
      description: result.description,
      files: {
        ttf: result.files.ttf.replace('public/', '/'),
        woff2: result.files.woff2.replace('public/', '/')
      },
      sizes: result.sizes,
      reduction: result.reduction
    }))
  };
  
  const manifestPath = path.join(CONFIG.outputDir, 'font-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`📋 Font manifest saved to ${manifestPath}`);
  
  return manifest;
}

// Main optimization function
async function optimizeFonts() {
  console.log('🚀 Starting font optimization...');
  console.log(`📁 Source: ${CONFIG.sourceFont}`);
  console.log(`📁 Output: ${CONFIG.outputDir}`);
  
  // Check if source font exists
  if (!fs.existsSync(CONFIG.sourceFont)) {
    console.error(`❌ Source font not found: ${CONFIG.sourceFont}`);
    process.exit(1);
  }
  
  // Check dependencies
  if (!checkDependencies()) {
    console.error('❌ Missing required dependencies');
    process.exit(1);
  }
  
  // Setup directories
  cleanDir(CONFIG.tempDir);
  cleanDir(CONFIG.outputDir);
  ensureDir(CONFIG.tempDir);
  ensureDir(CONFIG.outputDir);
  
  // Process each variant
  const results = [];
  for (const variant of CONFIG.variants) {
    const result = generateSubset(variant);
    if (result) {
      results.push(result);
    }
  }
  
  // Generate manifest
  const manifest = generateManifest(results);
  
  // Cleanup
  cleanDir(CONFIG.tempDir);
  
  // Summary
  console.log('\n🎉 Font optimization complete!');
  console.log(`📊 Generated ${results.length} optimized variants`);
  
  const totalOriginalSize = results.reduce((sum, r) => sum + r.sizes.original, 0);
  const totalOptimizedSize = results.reduce((sum, r) => sum + r.sizes.woff2, 0);
  const overallReduction = Math.round((1 - totalOptimizedSize / totalOriginalSize) * 100);
  
  console.log(`📊 Overall size reduction: ${overallReduction}%`);
  console.log(`📊 Total optimized size: ${formatSize(totalOptimizedSize * 1024)}`);
  
  return manifest;
}

// Run if called directly
if (require.main === module) {
  optimizeFonts().catch(error => {
    console.error('❌ Font optimization failed:', error);
    process.exit(1);
  });
}

module.exports = { optimizeFonts, CONFIG }; 