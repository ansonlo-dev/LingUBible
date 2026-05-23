const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 字體子集化工具 - 針對 LXGW WenKai 優化
class FontSubsetter {
  constructor() {
    this.fontsDir = path.join(__dirname, '../public/fonts');
    this.tempDir = path.join(__dirname, '../temp');
    
    // 確保目錄存在
    if (!fs.existsSync(this.fontsDir)) {
      fs.mkdirSync(this.fontsDir, { recursive: true });
    }
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  // 常用繁體中文字符集（包含嶺南大學相關詞彙）
  getTraditionalChineseCharSet() {
    return [
      // 基本常用字 (Big5 核心字符)
      '的一是在不了有和人這中大為上個國我以要他時來用們生到作地於出就分對成會可主發年動同工也能下過子說產種面而方後多定行學法所民得經十三之進著等部度家電力裡如水化高自二理起小物現實加量都兩體制機當使點從業本去把性好應開它合還因由其些然前外天政四日那社義事平形相全表間樣與關各重新線內數正心反你明看原又麼利比或但質氣第向道命此變條只沒結解問意建月公無系軍很情者最立代想已通並提直題黨程展五果料象員革位入常文總次品式活設及管特件長求老頭基資邊流路級少圖山統接知較將組見計別她手角期根論運農指幾九區強放決西被幹做必戰先回則任取據處隊南給色光門即保治北造百規熱領七海口東導器壓志世金增爭濟階油思術極交受聯什認六共權收證改清己美再採轉更單風切打白教速花帶安場身車例真務具萬每目至達走積示議聲報鬥完類八離華名確才科張信馬節話米整空元況今集溫傳土許步群廣石記需段研界拉林律叫且究觀越織裝影算低持音眾書布复容兒須際商非驗連斷深難近礦千週委素技備半辦青省列習響約支般史感勞便團往酸歷市克何除消構府稱太準精值號率族維劃選標寫存候毛親快效斯院查江型眼王按格養易置派層片始卻專狀育廠京識適屬圓包火住調滿縣局照參紅細引聽該鐵價嚴',
      
      // 教育相關詞彙
      '教育課程學習成績評分講師學生大學院系學期考試作業專業修課',
      
      // 嶺南大學相關
      '嶺南大學香港博雅通識選修必修學分校園宿舍圖書館',
      
      // 評論相關
      '評論評價推薦建議困難容易實用工作負擔期中期末測驗小組報告出席',
      
      // 數字和標點符號
      '０１２３４５６７８９．，；：！？「」『』（）【】〔〕《》〈〉',
      
      // 常用符號
      '＋－×÷＝≠≤≥％℃°α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ σ τ υ φ χ ψ ω'
    ].join('');
  }

  // 常用簡體中文字符集
  getSimplifiedChineseCharSet() {
    return [
      // 基本常用字 (GB2312 核心字符)
      '的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必战先回则任取据处队南给色光门即保治北造百规热领七海口东导器压志世金增争济阶油思术极交受联什认六共权收证改清己美再采转更单风切打白教速花带安场身车例真务具万每目至达走积示议声报斗完类八离华名确才科张信马节话米整空元况今集温传土许步群广石记需段研界拉林律叫且究观越织装影算低持音众书布复容儿须际商非验连断深难近矿千周委素技备半办青省列习响约支般史感劳便团往酸历市克何除消构府称太准精值号率族维划选标写存候毛亲快效斯院查江型眼王按格养易置派层片始却专状育厂京识适属圆包火住调满县局照参红细引听该铁价严',
      
      // 教育相关词汇
      '教育课程学习成绩评分讲师学生大学院系学期考试作业专业修课',
      
      // 岭南大学相关
      '岭南大学香港博雅通识选修必修学分校园宿舍图书馆',
      
      // 评论相关
      '评论评价推荐建议困难容易实用工作负担期中期末测验小组报告出席',
      
      // 数字和标点符号
      '０１２３４５６７８９．，；：！？「」『』（）【】〔〕《》〈〉',
      
      // 常用符号
      '＋－×÷＝≠≤≥％℃°α β γ δ ε ζ η θ ι κ λ μ ν ξ ο π ρ σ τ υ φ χ ψ ω'
    ].join('');
  }

  // 英文字符集（搭配中文使用）
  getEnglishCharSet() {
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,;:!?()[]{}"\'-_@#$%^&*+=<>/\\|~`';
  }

  // 使用 pyftsubset 創建字體子集
  createSubset(inputFont, outputFont, unicodeRange) {
    try {
      const cmd = `pyftsubset "${inputFont}" --output-file="${outputFont}" --unicodes="${unicodeRange}" --flavor=woff2 --layout-features="*" --glyph-names --symbol-cmap --legacy-cmap --notdef-glyph --notdef-outline --recommended-glyphs --name-IDs="*" --ignore-missing-glyphs`;
      
      console.log(`Creating subset: ${outputFont}`);
      execSync(cmd, { stdio: 'inherit' });
      console.log(`✅ Created: ${outputFont}`);
      
      // 顯示檔案大小
      const stats = fs.statSync(outputFont);
      console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      
    } catch (error) {
      console.error(`❌ Error creating subset ${outputFont}:`, error.message);
    }
  }

  // 將字符集轉換為 Unicode 範圍
  charsToUnicodeRange(chars) {
    return chars.split('').map(char => 
      'U+' + char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')
    ).join(',');
  }

  // 執行字體子集化
  async processFont(fontPath) {
    const fontName = path.basename(fontPath, path.extname(fontPath));
    
    // 創建繁體中文子集
    const tcChars = this.getTraditionalChineseCharSet();
    const tcUnicodeRange = this.charsToUnicodeRange(tcChars);
    const tcOutputPath = path.join(this.fontsDir, `${fontName}-TC.woff2`);
    this.createSubset(fontPath, tcOutputPath, tcUnicodeRange);
    
    // 創建簡體中文子集
    const scChars = this.getSimplifiedChineseCharSet();
    const scUnicodeRange = this.charsToUnicodeRange(scChars);
    const scOutputPath = path.join(this.fontsDir, `${fontName}-SC.woff2`);
    this.createSubset(fontPath, scOutputPath, scUnicodeRange);
    
    // 創建英文子集
    const enChars = this.getEnglishCharSet();
    const enUnicodeRange = this.charsToUnicodeRange(enChars);
    const enOutputPath = path.join(this.fontsDir, `${fontName}-EN.woff2`);
    this.createSubset(fontPath, enOutputPath, enUnicodeRange);
    
    console.log('🎉 Font subsetting completed!');
  }
}

// 使用範例
const subsetter = new FontSubsetter();

// 如果提供了字體路徑參數
if (process.argv[2]) {
  subsetter.processFont(process.argv[2]);
} else {
  console.log('Usage: node font-subset.js <font-path>');
  console.log('Example: node font-subset.js /path/to/LXGWWenKai-Regular.ttf');
}

module.exports = FontSubsetter; 