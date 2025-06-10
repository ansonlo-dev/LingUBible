import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, AlertTriangle, Mail, Settings, Info, AlertCircle, Zap } from 'lucide-react';
import { studentVerificationService } from "@/services/external/studentVerification";
import { useLanguage } from '@/contexts/LanguageContext';
import { DEV_MODE, isValidEmailForRegistration, getEmailType, getDevModeMessage, isDisposableEmail } from '@/config/devMode';
import { theme } from '@/lib/utils';

interface StudentVerificationInputProps {
  email: string;
  onSendCode: (email: string) => Promise<{ success: boolean; message: string }>;
  onVerifyCode: (email: string, code: string) => Promise<{ success: boolean; message: string }>;
  getRemainingTime: (email: string) => number;
  onCodeVerified: () => void;
  disabled?: boolean;
}

// 檢查郵件是否為有效的學生郵件
const isValidStudentEmail = (email: string): boolean => {
  const emailLower = email.toLowerCase();
  // 使用正則表達式確保完全匹配，防止像 abc@ln.edsf.hk 這樣的郵件通過
  const validEmailPattern = /^[a-zA-Z0-9._%+-]+@(ln\.hk|ln\.edu\.hk)$/;
  return validEmailPattern.test(emailLower);
};

export function StudentVerificationInput({
  email,
  onSendCode,
  onVerifyCode,
  getRemainingTime,
  onCodeVerified,
  disabled = false
}: StudentVerificationInputProps) {
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [countdown, setCountdown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);

  const { t, language } = useLanguage();

  // 倒數計時器
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // 檢查剩餘時間
  useEffect(() => {
    if (email) {
      const remaining = getRemainingTime(email);
      if (remaining > 0) {
        setCountdown(remaining);
        setIsCodeSent(true);
      }
    }
  }, [email, getRemainingTime]);

  const handleSendCode = async () => {
    if (!email || isSending) return;

    // 使用新的開發模式郵件驗證
    if (!isValidEmailForRegistration(email)) {
      if (DEV_MODE.enabled) {
        setMessage('請輸入有效的郵件地址格式');
      } else {
        setMessage(t('verification.onlyStudentEmails'));
      }
      setMessageType('error');
      return;
    }

    setIsSending(true);
    setMessage(t('verification.sendingCode'));
    setMessageType('info');

    try {
      // 獲取當前主題
      const currentTheme = theme.getEffectiveTheme();
      console.log('🔄 開始發送驗證碼流程:', { email, language, theme: currentTheme });
      
      // 使用多語言和主題支援的發送函數
      const result = await studentVerificationService.sendVerificationCode(email, language, currentTheme);
      
      console.log('📬 發送結果:', result);
      
      if (result.success) {
        setIsCodeSent(true);
        setCountdown(600); // 10 分鐘倒數
        setMessage(result.message);
        setMessageType('success');
        
        // 額外的成功提示
        console.log('✅ 驗證碼發送成功');
        
        // 開發模式下自動完成驗證
        if (DEV_MODE.enabled) {
          console.log('🔧 開發模式：自動完成驗證');
          setTimeout(() => {
            setIsVerified(true);
            setMessage('開發模式：驗證已自動完成');
            setMessageType('success');
            onCodeVerified();
          }, 500); // 短暫延遲以顯示發送成功訊息
        }
      } else {
        setMessage(result.message);
        setMessageType('error');
        console.error('❌ 發送失敗:', result.message);
      }
    } catch (error: any) {
      console.error('💥 發送過程中發生異常:', error);
      setMessage(`發送失敗: ${error.message || '未知錯誤'}`);
      setMessageType('error');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || isVerifying) return;

    setIsVerifying(true);
    setMessage('');

    try {
      // 使用新的異步後端驗證方法
      const result = await studentVerificationService.verifyCode(email, verificationCode);
      
      if (result.success) {
        setIsVerified(true);
        setMessage(result.message);
        setMessageType('success');
        onCodeVerified();
      } else {
        setMessage(result.message);
        setMessageType('error');
      }
    } catch (error: any) {
      console.error('驗證過程中發生錯誤:', error);
      setMessage(error.message || t('verification.verifyFailed'));
      setMessageType('error');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const canSendCode = !isSending && countdown === 0 && !isVerified;
  const canVerifyCode = isCodeSent && verificationCode.length === 6 && !isVerifying && !isVerified;

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <div className="flex items-center space-x-2">
        <Mail className="h-4 w-4 text-primary" />
        <Label className="text-sm font-medium">{t('verification.title')}</Label>
        {DEV_MODE.enabled && (
          <div className="flex items-center space-x-1">
            <Settings className="h-3 w-3 text-orange-500" />
            <span className="text-xs text-orange-600 dark:text-orange-400">DEV</span>
          </div>
        )}
      </div>

      {/* 開發模式提示 */}
      {DEV_MODE.enabled && (
        <div className="space-y-2">
          <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
            <Settings className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              {getDevModeMessage('devModeEnabled', language)}
            </AlertDescription>
          </Alert>
          
          {/* 一次性郵件提示 */}
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <Zap className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              {getDevModeMessage('disposableEmailTip', language)}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* 郵件類型提示 */}
      {email && DEV_MODE.enabled && (
        <div className="text-xs">
          {(() => {
            const emailType = getEmailType(email);
            if (emailType === 'student') {
              return (
                <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-3 w-3" />
                  <span>嶺南人郵件地址</span>
                </div>
              );
            } else if (emailType === 'disposable') {
              return (
                <div className="flex items-center space-x-1 text-purple-600 dark:text-purple-400">
                  <Zap className="h-3 w-3" />
                  <span>一次性郵件地址 - 適合測試使用</span>
                </div>
              );
            } else if (emailType === 'test') {
              return (
                <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{getDevModeMessage('testEmailWarning', language)}</span>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}

      {/* 發送驗證碼按鈕 */}
      {!isCodeSent && !isVerified && (
        <Button
          type="button"
          onClick={handleSendCode}
          disabled={disabled || !canSendCode}
          className="w-full"
        >
          {isSending ? t('auth.sending') : t('verification.sendCode')}
        </Button>
      )}

      {/* 重新發送按鈕 */}
      {isCodeSent && !isVerified && countdown === 0 && (
        <Button
          type="button"
          onClick={handleSendCode}
          disabled={disabled || isSending}
          variant="outline"
          className="w-full"
        >
          {isSending ? t('verification.sendingCode') : `${t('verification.resend')}${t('verification.sendCode')}`}
        </Button>
      )}

      {/* 倒數計時 */}
      {countdown > 0 && !isVerified && (
        <div className="text-center text-sm text-muted-foreground">
          {formatTime(countdown)} {t('verification.resendAfter')}
        </div>
      )}

      {/* 郵件提醒框 */}
      {isCodeSent && !isVerified && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {t('email.reminder.title')}
              </h4>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <p>{t('email.reminder.checkSpam')}</p>
                <p>{t('email.reminder.whitelist')}</p>
                <p>{t('email.reminder.deliveryTime')}</p>
                <p>{t('email.reminder.contactSupport')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 驗證碼輸入 */}
      {isCodeSent && !isVerified && (
        <div className="space-y-2">
          <Label htmlFor="verificationCode" className="text-sm">
            {t('verification.enterCode')}
          </Label>
          <div className="flex space-x-2">
            <Input
              id="verificationCode"
              type="text"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationCode(value);
              }}
              placeholder="123456"
              className="text-center text-lg font-mono tracking-widest"
              disabled={disabled || isVerifying}
              maxLength={6}
            />
            <Button
              type="button"
              onClick={handleVerifyCode}
              disabled={disabled || !canVerifyCode}
              className="px-6"
            >
              {isVerifying ? t('verification.verifying') : t('verification.verify')}
            </Button>
          </div>
        </div>
      )}

      {/* 訊息顯示 */}
      {message && (
        <div className={`p-3 rounded-md border ${
          messageType === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
            : messageType === 'error'
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
        }`}>
          <div className="flex items-start space-x-2">
            {messageType === 'success' && <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />}
            {messageType === 'error' && <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />}
            {messageType === 'info' && <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />}
            <p className={`text-sm ${
              messageType === 'success' 
                ? 'text-green-600 dark:text-green-400' 
                : messageType === 'error'
                ? 'text-red-600 dark:text-red-400'
                : 'text-blue-600 dark:text-blue-400'
            }`}>
              {message}
            </p>
          </div>
        </div>
      )}

      {/* 提示信息 */}
      {!isCodeSent && (
        <div className="text-xs text-muted-foreground">
          <p>• {t('verification.onlyStudentEmails')}</p>
          <p>• {t('verification.codeExpiry')}</p>
          <p>• {t('verification.maxAttempts')}</p>
        </div>
      )}
    </div>
  );
} 