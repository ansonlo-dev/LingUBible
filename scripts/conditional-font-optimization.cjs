#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Conditional Font Optimization Script
 * 
 * This script intelligently decides whether to run font optimization based on:
 * 1. Environment (production vs development)
 * 2. Existing optimized fonts
 * 3. Force flag
 */

const OPTIMIZED_FONTS_DIR = 'public/fonts/optimized';
const FONT_MANIFEST = path.join(OPTIMIZED_FONTS_DIR, 'font-manifest.json');

// Check command line arguments
const args = process.argv.slice(2);
const isForce = args.includes('--force') || args.includes('-f');
const isProduction = process.env.NODE_ENV === 'production' || 
                    process.env.CI === 'true' || 
                    args.includes('--production') || 
                    args.includes('--prod');

console.log('🔍 Font Optimization Checker');
console.log(`📦 Environment: ${isProduction ? 'Production' : 'Development'}`);
console.log(`🔧 Force mode: ${isForce ? 'Enabled' : 'Disabled'}`);

// Check if optimized fonts already exist
function checkOptimizedFontsExist() {
  try {
    if (!fs.existsSync(FONT_MANIFEST)) {
      return false;
    }

    const manifest = JSON.parse(fs.readFileSync(FONT_MANIFEST, 'utf8'));
    
    // Check if all font files exist
    const allFilesExist = manifest.variants.every(variant => {
      const woff2Path = path.join('public', variant.files.woff2);
      const ttfPath = path.join('public', variant.files.ttf);
      return fs.existsSync(woff2Path) && fs.existsSync(ttfPath);
    });

    if (allFilesExist) {
      const manifestDate = new Date(manifest.generated);
      const daysSinceGenerated = (Date.now() - manifestDate.getTime()) / (1000 * 60 * 60 * 24);
      
      console.log(`✅ Optimized fonts found (generated ${Math.round(daysSinceGenerated)} days ago)`);
      console.log(`📊 Available variants: ${manifest.variants.map(v => v.name).join(', ')}`);
      return true;
    }
  } catch (error) {
    console.log('⚠️ Error checking existing fonts:', error.message);
  }
  
  return false;
}

// Check if fonttools is available
function checkFonttoolsAvailable() {
  try {
    execSync('python -c "import fontTools.subset"', { stdio: 'ignore' });
    return true;
  } catch (error) {
    try {
      execSync('python3 -c "import fontTools.subset"', { stdio: 'ignore' });
      return true;
    } catch (error) {
      try {
        execSync('pyftsubset --help', { stdio: 'ignore' });
        return true;
      } catch (error) {
        return false;
      }
    }
  }
}

// Main logic
function shouldOptimizeFonts() {
  if (isForce) {
    console.log('🚀 Force mode: Running font optimization');
    return true;
  }

  if (!isProduction) {
    const fontsExist = checkOptimizedFontsExist();
    if (fontsExist) {
      console.log('⏭️ Development mode: Skipping font optimization (fonts already exist)');
      console.log('💡 To force optimization, run: bun run fonts:optimize --force');
      return false;
    } else {
      console.log('🔄 Development mode: No optimized fonts found, running optimization once...');
      return true;
    }
  }

  // Production mode - check if fonttools is available
  const fonttoolsAvailable = checkFonttoolsAvailable();
  if (!fonttoolsAvailable) {
    const fontsExist = checkOptimizedFontsExist();
    if (fontsExist) {
      console.log('⚠️ Production mode: fonttools not available, using existing optimized fonts');
      console.log('💡 This is normal for some deployment environments (e.g., Cloudflare Workers)');
      return false;
    } else {
      console.log('❌ Production mode: fonttools not available and no existing fonts found');
      console.log('📦 Please run font optimization locally first with: bun run fonts:optimize');
      // Don't fail the build, just warn
      console.log('⚠️ Continuing build without font optimization...');
      return false;
    }
  }

  console.log('🏭 Production mode: Running font optimization');
  return true;
}

// Execute font optimization if needed
if (shouldOptimizeFonts()) {
  console.log('\n🎯 Starting font optimization...');
  try {
    execSync('node scripts/optimize-fonts.cjs', { stdio: 'inherit' });
    console.log('✅ Font optimization completed successfully');
  } catch (error) {
    console.error('❌ Font optimization failed:', error.message);
    
    // In production, if fonts already exist, don't fail the build
    if (isProduction && checkOptimizedFontsExist()) {
      console.log('⚠️ Using existing optimized fonts instead');
      console.log('💡 Build will continue...');
    } else {
      console.error('💥 No fallback fonts available, build cannot continue');
      process.exit(1);
    }
  }
} else {
  console.log('✅ Font optimization skipped');
}

console.log('🏁 Font build step completed\n'); 