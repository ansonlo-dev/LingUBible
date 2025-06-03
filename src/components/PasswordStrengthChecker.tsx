import { useState, useEffect } from 'react';
import { Check, X, AlertTriangle, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PasswordStrengthCheckerProps {
  password: string;
  email?: string;
  onValidationChange: (isValid: boolean) => void;
}

// 常用密碼列表（前100個最常用的密碼）
const COMMON_PASSWORDS = [
  '123456', 'password', '12345678', 'qwerty', '123456789', '12345', '1234',
  '111111', '1234567', 'dragon', '123123', 'baseball', 'abc123', 'football',
  'monkey', 'letmein', '696969', 'shadow', 'master', '666666', 'qwertyuiop',
  '123321', 'mustang', '1234567890', 'michael', '654321', 'pussy', 'superman',
  '1qaz2wsx', '7777777', 'fuckyou', '121212', '000000', 'qazwsx', '123qwe',
  'killer', 'trustno1', 'jordan', 'jennifer', 'zxcvbnm', 'asdfgh', 'hunter',
  'buster', 'soccer', 'harley', 'batman', 'andrew', 'tigger', 'sunshine',
  'iloveyou', 'fuckme', '2000', 'charlie', 'robert', 'thomas', 'hockey',
  'ranger', 'daniel', 'starwars', 'klaster', '112233', 'george', 'asshole',
  'computer', 'michelle', 'jessica', 'pepper', '1111', 'zxcvbn', '555555',
  '11111111', '131313', 'freedom', '777777', 'pass', 'fuck', 'maggie',
  '159753', 'aaaaaa', 'ginger', 'princess', 'joshua', 'cheese', 'amanda',
  'summer', 'love', 'ashley', '6969', 'nicole', 'chelsea', 'biteme',
  'matthew', 'access', 'yankees', '987654321', 'dallas', 'austin', 'thunder',
  'taylor', 'matrix', 'william', 'corvette', 'hello', 'martin', 'heather'
];

// 洩露密碼模式檢測
const LEAKED_PATTERNS = [
  /^password\d*$/i,
  /^123456\d*$/,
  /^qwerty\d*$/i,
  /^admin\d*$/i,
  /^welcome\d*$/i,
  /^letmein\d*$/i,
  /^monkey\d*$/i,
  /^dragon\d*$/i,
  /^master\d*$/i,
  /^sunshine\d*$/i
];

interface ValidationRule {
  id: string;
  label: string;
  isValid: boolean;
  type: 'requirement' | 'warning' | 'error';
}

export function PasswordStrengthChecker({ password, email, onValidationChange }: PasswordStrengthCheckerProps) {
  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [strength, setStrength] = useState<'weak' | 'fair' | 'good' | 'strong'>('weak');
  const { t } = useLanguage();

  useEffect(() => {
    const newRules = validatePassword(password, email);
    setRules(newRules);
    
    // 計算密碼強度
    const requiredRules = newRules.filter(rule => rule.type === 'requirement');
    const validRequiredRules = requiredRules.filter(rule => rule.isValid);
    const warningRules = newRules.filter(rule => rule.type === 'warning' && !rule.isValid);
    const errorRules = newRules.filter(rule => rule.type === 'error' && !rule.isValid);
    
    // 檢查是否所有必需規則都滿足且沒有錯誤
    const allRequiredValid = validRequiredRules.length === requiredRules.length;
    const hasErrors = errorRules.length > 0;
    const hasWarnings = warningRules.length > 0;
    
    // 更細緻的強度計算
    let newStrength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
    
    if (hasErrors || !allRequiredValid) {
      // 有錯誤或必需要求未滿足 = 弱
      newStrength = 'weak';
    } else if (allRequiredValid && !hasErrors) {
      // 所有必需要求滿足且無錯誤
      if (password.length >= 12 && !hasWarnings) {
        // 長度充足且無警告 = 強
        newStrength = 'strong';
      } else if (password.length >= 10 && !hasWarnings) {
        // 長度適中且無警告 = 良好
        newStrength = 'good';
      } else if (!hasWarnings) {
        // 無警告但長度較短 = 中等
        newStrength = 'fair';
      } else {
        // 有警告 = 中等
        newStrength = 'fair';
      }
    }
    
    setStrength(newStrength);
    
    // 通知父組件驗證結果
    onValidationChange(allRequiredValid && !hasErrors);
  }, [password, email, onValidationChange, t]);

  const validatePassword = (pwd: string, userEmail?: string): ValidationRule[] => {
    const rules: ValidationRule[] = [];

    // 長度檢查 (8-40字符)
    rules.push({
      id: 'length',
      label: t('password.length'),
      isValid: pwd.length >= 8 && pwd.length <= 40,
      type: 'requirement'
    });

    // 大寫字母檢查
    rules.push({
      id: 'uppercase',
      label: t('password.uppercase'),
      isValid: /[A-Z]/.test(pwd),
      type: 'requirement'
    });

    // 小寫字母檢查
    rules.push({
      id: 'lowercase',
      label: t('password.lowercase'),
      isValid: /[a-z]/.test(pwd),
      type: 'requirement'
    });

    // 特殊符號檢查
    rules.push({
      id: 'special',
      label: t('password.special'),
      isValid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
      type: 'requirement'
    });

    // 數字檢查（改為必需要求）
    rules.push({
      id: 'number',
      label: t('password.number'),
      isValid: /\d/.test(pwd),
      type: 'requirement'
    });

    // 常用密碼檢查
    const isCommonPassword = COMMON_PASSWORDS.includes(pwd.toLowerCase());
    rules.push({
      id: 'common',
      label: t('password.notCommon'),
      isValid: !isCommonPassword,
      type: 'error'
    });

    // 洩露密碼模式檢查
    const isLeakedPattern = LEAKED_PATTERNS.some(pattern => pattern.test(pwd));
    rules.push({
      id: 'leaked',
      label: t('password.notLeaked'),
      isValid: !isLeakedPattern,
      type: 'error'
    });

    // 學校郵件密碼檢查
    if (userEmail && (userEmail.includes('@ln.edu.hk') || userEmail.includes('@ln.hk'))) {
      // 檢查密碼是否包含郵件地址的部分
      const emailPrefix = userEmail.split('@')[0].toLowerCase();
      const containsEmailPart = pwd.toLowerCase().includes(emailPrefix) || 
                               emailPrefix.includes(pwd.toLowerCase());
      
      rules.push({
        id: 'school-email',
        label: t('password.notSimilarToEmail'),
        isValid: !containsEmailPart,
        type: 'warning'
      });
    }

    // 長度建議
    if (pwd.length >= 8 && pwd.length < 12) {
      rules.push({
        id: 'length-suggestion',
        label: t('password.lengthSuggestion'),
        isValid: false,
        type: 'warning'
      });
    }

    return rules;
  };

  const getStrengthColor = () => {
    switch (strength) {
      case 'weak': return 'bg-red-500';
      case 'fair': return 'bg-yellow-500';
      case 'good': return 'bg-blue-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthText = () => {
    switch (strength) {
      case 'weak': return t('password.weak');
      case 'fair': return t('password.fair');
      case 'good': return t('password.good');
      case 'strong': return t('password.strong');
      default: return '未知';
    }
  };

  const getStrengthWidth = () => {
    switch (strength) {
      case 'weak': return '25%';
      case 'fair': return '50%';
      case 'good': return '75%';
      case 'strong': return '100%';
      default: return '0%';
    }
  };

  if (!password) return null;

  return (
    <div className="space-y-4">
      {/* 密碼強度指示器 */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('password.strength')}
          </span>
          <span className={`text-sm font-medium ${
            strength === 'strong' ? 'text-green-600' :
            strength === 'good' ? 'text-blue-600' :
            strength === 'fair' ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {getStrengthText()}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
            style={{ width: getStrengthWidth() }}
          />
        </div>
      </div>

      {/* 密碼要求列表 */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('password.requirements')}
        </h4>
        <div className="space-y-1">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center space-x-2">
              {rule.type === 'requirement' && (
                rule.isValid ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )
              )}
              {rule.type === 'warning' && (
                rule.isValid ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )
              )}
              {rule.type === 'error' && (
                rule.isValid ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )
              )}
              <span className={`text-sm ${
                rule.isValid 
                  ? 'text-green-600 dark:text-green-400' 
                  : rule.type === 'error' 
                    ? 'text-red-600 dark:text-red-400'
                    : rule.type === 'warning'
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-gray-600 dark:text-gray-400'
              }`}>
                {rule.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 學校郵件提醒 - 始終顯示給學校郵件用戶 */}
      {email && (email.includes('@ln.edu.hk') || email.includes('@ln.hk')) && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="flex items-start space-x-2">
            <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-600 dark:text-blue-400">
              <p className="font-medium">{t('password.securityReminder')}</p>
              <p>{t('password.schoolEmailWarning')}</p>
            </div>
          </div>
        </div>
      )}

      {/* 常用密碼警告 */}
      {rules.find(rule => rule.id === 'common' && !rule.isValid) && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-start space-x-2">
            <X className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="text-sm text-red-600 dark:text-red-400">
              <p className="font-medium">{t('password.commonPasswordDanger')}</p>
              <p>{t('password.commonPasswordMessage')}</p>
            </div>
          </div>
        </div>
      )}

      {/* 洩露密碼警告 */}
      {rules.find(rule => rule.id === 'leaked' && !rule.isValid) && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-start space-x-2">
            <X className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
            <div className="text-sm text-red-600 dark:text-red-400">
              <p className="font-medium">{t('password.leakedPasswordRisk')}</p>
              <p>{t('password.leakedPasswordMessage')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 