import { useState, useEffect } from 'react';
import { Check, X, AlertTriangle, Shield, Info } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { DEV_MODE, getDevModeMessage } from '@/config/devMode';

interface ValidationRule {
  id: string;
  label: string;
  isValid: boolean;
  type: 'requirement' | 'warning' | 'info';
}

interface PasswordStrengthCheckerProps {
  password: string;
  email?: string;
  onValidationChange: (isValid: boolean) => void;
}

// 檢查郵件是否為有效的學生郵件
const isValidStudentEmail = (email: string): boolean => {
  const emailLower = email.toLowerCase();
  // 使用正則表達式確保完全匹配，防止像 abc@ln.edsf.hk 這樣的郵件通過
  const validEmailPattern = /^[a-zA-Z0-9._%+-]+@(ln\.hk|ln\.edu\.hk)$/;
  return validEmailPattern.test(emailLower);
};

// 常見密碼列表（簡化版）
const commonPasswords = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'qwerty123', 'dragon', 'master', 'hello', 'login', 'admin123',
  'root', 'pass', 'test', 'guest', 'user', 'demo', 'sample',
  'lingnan', 'student', 'university', 'college', 'school'
];

// 已知洩露密碼模式（簡化版）
const leakedPasswordPatterns = [
  /^password\d*$/i,
  /^123456\d*$/,
  /^qwerty\d*$/i,
  /^admin\d*$/i,
  /^welcome\d*$/i,
  /^letmein\d*$/i,
  /^monkey\d*$/i,
  /^dragon\d*$/i,
  /^master\d*$/i,
  /^hello\d*$/i,
  /^login\d*$/i,
  /^root\d*$/i,
  /^guest\d*$/i,
  /^test\d*$/i,
  /^demo\d*$/i,
  /^sample\d*$/i
];

export function PasswordStrengthChecker({ password, email, onValidationChange }: PasswordStrengthCheckerProps) {
  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [strength, setStrength] = useState<'weak' | 'fair' | 'good' | 'strong'>('weak');
  const { t } = useLanguage();

  useEffect(() => {
    if (!password) {
      setRules([]);
      setStrength('weak');
      onValidationChange(false);
      return;
    }

    // 開發模式密碼繞過
    if (DEV_MODE.enabled && DEV_MODE.bypassPassword) {
      setRules([]);
      setStrength('strong');
      onValidationChange(true);
      return;
    }

    const validationRules = validatePassword(password, email);
    setRules(validationRules);

    // 計算密碼強度
    const requiredRules = validationRules.filter(rule => rule.type === 'requirement');
    const validRequiredRules = requiredRules.filter(rule => rule.isValid);
    const validPercentage = validRequiredRules.length / requiredRules.length;

    let newStrength: 'weak' | 'fair' | 'good' | 'strong' = 'weak';
    if (validPercentage >= 1) {
      newStrength = 'strong';
    } else if (validPercentage >= 0.8) {
      newStrength = 'good';
    } else if (validPercentage >= 0.6) {
      newStrength = 'fair';
    }

    setStrength(newStrength);

    // 檢查是否所有必需規則都通過
    const allRequiredValid = requiredRules.every(rule => rule.isValid);
    onValidationChange(allRequiredValid);
  }, [password, email, onValidationChange, t]);

  const validatePassword = (pwd: string, userEmail?: string): ValidationRule[] => {
    const rules: ValidationRule[] = [];

    // 長度檢查
    rules.push({
      id: 'length',
      label: t('password.length'),
      isValid: pwd.length >= 8 && pwd.length <= 40,
      type: 'requirement'
    });

    // 大寫字母
    rules.push({
      id: 'uppercase',
      label: t('password.uppercase'),
      isValid: /[A-Z]/.test(pwd),
      type: 'requirement'
    });

    // 小寫字母
    rules.push({
      id: 'lowercase',
      label: t('password.lowercase'),
      isValid: /[a-z]/.test(pwd),
      type: 'requirement'
    });

    // 特殊字符
    rules.push({
      id: 'special',
      label: t('password.special'),
      isValid: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
      type: 'requirement'
    });

    // 數字
    rules.push({
      id: 'number',
      label: t('password.number'),
      isValid: /\d/.test(pwd),
      type: 'requirement'
    });

    // 常見密碼檢查
    const isCommon = commonPasswords.some(common => 
      pwd.toLowerCase().includes(common.toLowerCase()) || 
      common.toLowerCase().includes(pwd.toLowerCase())
    );
    
    rules.push({
      id: 'common',
      label: t('password.notCommon'),
      isValid: !isCommon,
      type: 'requirement'
    });

    // 洩露密碼檢查
    const isLeaked = leakedPasswordPatterns.some(pattern => pattern.test(pwd));
    
    rules.push({
      id: 'leaked',
      label: t('password.notLeaked'),
      isValid: !isLeaked,
      type: 'requirement'
    });

    // 學校郵件密碼檢查
    if (userEmail && isValidStudentEmail(userEmail)) {
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

  // 開發模式密碼繞過提示
  if (DEV_MODE.enabled && DEV_MODE.bypassPassword) {
    return (
      <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
        <div className="flex items-center space-x-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{t('password.strength')}</span>
        </div>

        {/* 開發模式繞過提示 */}
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="text-sm text-green-600 dark:text-green-400">
              <p className="font-medium">🔓 密碼強度檢查已繞過 - 開發模式</p>
              <p>⚠️ 生產環境請啟用密碼強度檢查</p>
            </div>
          </div>
        </div>

        {/* 簡化的強度指示器 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{t('password.strengthLabel')}</span>
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              {t('password.strong')} (開發模式)
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className="h-2 rounded-full transition-all duration-300 bg-green-500 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center space-x-2">
        <Shield className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{t('password.strength')}</span>
      </div>

      {/* 密碼強度指示器 */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{t('password.strengthLabel')}</span>
          <span className={`text-sm font-medium ${
            strength === 'strong' ? 'text-green-600 dark:text-green-400' :
            strength === 'good' ? 'text-blue-600 dark:text-blue-400' :
            strength === 'fair' ? 'text-yellow-600 dark:text-yellow-400' :
            'text-red-600 dark:text-red-400'
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

      {/* 密碼要求 */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">{t('password.requirements')}</h4>
        <div className="space-y-1">
          {rules.filter(rule => rule.type === 'requirement').map((rule) => (
            <div key={rule.id} className="flex items-center space-x-2">
              {rule.isValid ? (
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <X className="h-4 w-4 text-red-600 dark:text-red-400" />
              )}
              <span className={`text-sm ${
                rule.isValid 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {rule.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 警告和建議 */}
      {rules.some(rule => rule.type === 'warning' && !rule.isValid) && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-yellow-600 dark:text-yellow-400">建議：</h4>
          <div className="space-y-1">
            {rules.filter(rule => rule.type === 'warning' && !rule.isValid).map((rule) => (
              <div key={rule.id} className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-sm text-yellow-600 dark:text-yellow-400">
                  {rule.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 學校郵件安全提醒 */}
      {email && isValidStudentEmail(email) && (
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