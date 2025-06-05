// 用戶名驗證工具
import Filter from 'bad-words-chinese';

// 粵語髒話詞彙列表
const cantoneseSwearWords = [
  // 粵語五大髒話
  '屌', '𨳒', 'diu', 'diu2',
  '㞗', '𨳊', '鳩', 'gau', 'gau1',
  '𡳞', '𨶙', '撚', 'lan', 'lan2',
  '杘', '𡴶', '𨳍', '柒', 'cat', 'cat6',
  '㞓', '屄', '閪', 'hai', 'hai1',
  // 常見粵語髒話組合
  '屌你', '𨳒你', '屌那媽', '𨳒那媽',
  '戇鳩', '戇㞗', '戇居', '戇Q', 'on9',
  '撚樣', '𡳞樣', '柒頭', '杘頭', '𡴶頭',
  '傻㞓', '傻屄', '傻閪', '臭㞓', '臭屄', '臭閪',
  '仆街', '踣街', 'pk', 'PK',
  '冚家鏟', '咸家鏟', '冚家拎', '咸家拎',
  '冚家富貴', '咸家富貴', '冚家祥', '咸家祥',
  // 其他粵語不當詞彙
  '西口西面', '西人', '鞋', '蟹',
  '懶', '能', '七', '刷', '賊', '笨賊',
  '硬膠', '硬胶', '無厘頭', '黐線', '黐㞗線'
];

// 初始化壞詞過濾器，包含粵語髒話
const filter = new Filter({
  placeHolder: '*',
  // 添加一些常見的不當詞彙
  englishList: [
    'admin', 'administrator', 'root', 'system', 'test', 'guest', 'user',
    'null', 'undefined', 'bot', 'api', 'service', 'support', 'help',
    'moderator', 'mod', 'staff', 'official', 'lingubible', 'ln', 'hk'
  ],
  chineseList: [
    '管理員', '管理者', '系統', '測試', '客服', '官方', '嶺南', '嶺大',
    '版主', '助理', '老師', '教授', '校長', '主任',
    // 添加粵語髒話到中文列表
    ...cantoneseSwearWords
  ]
});

export interface UsernameValidationResult {
  isValid: boolean;
  error?: string;
  cleanedUsername?: string;
}

export class UsernameValidator {
  private static readonly MIN_LENGTH = 2;
  private static readonly MAX_LENGTH = 10; // 擴展到10個字符
  
  /**
   * 檢查字符串是否只包含空格或不可見字符
   * @param str 要檢查的字符串
   * @returns 是否只包含空格或不可見字符
   */
  private static isOnlyWhitespaceOrInvisible(str: string): boolean {
    // 檢查是否只包含空格、制表符、換行符等空白字符
    // 以及各種不可見的Unicode字符
    const invisibleCharsRegex = /^[\s\u00A0\u1680\u2000-\u200B\u2028\u2029\u202F\u205F\u3000\uFEFF]*$/;
    return invisibleCharsRegex.test(str);
  }
  
  /**
   * 驗證用戶名
   * @param username 要驗證的用戶名
   * @returns 驗證結果
   */
  static validate(username: string): UsernameValidationResult {
    // 檢查是否為空
    if (!username || username.length === 0) {
      return {
        isValid: false,
        error: '用戶名不能為空'
      };
    }

    // 檢查是否只包含空格或不可見字符
    if (this.isOnlyWhitespaceOrInvisible(username)) {
      return {
        isValid: false,
        error: '用戶名不能只包含空格或不可見字符'
      };
    }

    const trimmedUsername = username.trim();

    // 再次檢查trim後是否為空
    if (trimmedUsername.length === 0) {
      return {
        isValid: false,
        error: '用戶名不能只包含空格'
      };
    }

    // 檢查長度
    if (trimmedUsername.length < this.MIN_LENGTH) {
      return {
        isValid: false,
        error: `用戶名長度不能少於 ${this.MIN_LENGTH} 個字符`
      };
    }

    if (trimmedUsername.length > this.MAX_LENGTH) {
      return {
        isValid: false,
        error: `用戶名長度不能超過 ${this.MAX_LENGTH} 個字符`
      };
    }

    // 檢查是否包含不當內容（包括粵語髒話）
    if (filter.isProfane(trimmedUsername)) {
      return {
        isValid: false,
        error: '用戶名包含不當內容，請重新輸入'
      };
    }

    // 檢查是否全為空格或特殊字符
    if (!/[\u4e00-\u9fa5a-zA-Z0-9]/.test(trimmedUsername)) {
      return {
        isValid: false,
        error: '用戶名必須包含至少一個中文字符、英文字母或數字'
      };
    }

    return {
      isValid: true,
      cleanedUsername: trimmedUsername
    };
  }

  /**
   * 清理用戶名中的不當內容（用於顯示）
   * @param username 用戶名
   * @returns 清理後的用戶名
   */
  static clean(username: string): string {
    if (!username) return '';
    return filter.clean(username.trim());
  }

  /**
   * 檢查用戶名是否包含不當內容
   * @param username 用戶名
   * @returns 是否包含不當內容
   */
  static isProfane(username: string): boolean {
    if (!username) return false;
    return filter.isProfane(username.trim());
  }

  /**
   * 生成用戶名建議（基於郵箱）
   * @param email 郵箱地址
   * @returns 建議的用戶名
   */
  static generateSuggestion(email: string): string {
    if (!email) return '';
    
    const localPart = email.split('@')[0];
    
    // 移除常見的數字後綴和特殊字符
    let suggestion = localPart
      .replace(/[._-]/g, '')
      .replace(/\d+$/, '')
      .substring(0, this.MAX_LENGTH);
    
    // 如果建議的用戶名太短，使用郵箱前綴
    if (suggestion.length < this.MIN_LENGTH) {
      suggestion = localPart.substring(0, this.MAX_LENGTH);
    }
    
    return suggestion;
  }
}

export default UsernameValidator; 