import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CheckCircle, AlertCircle, Clock, Code } from 'lucide-react';
import { studentVerificationService } from '@/services/studentVerificationService';

interface StudentVerificationInputProps {
  email: string;
  onSendCode: (email: string) => Promise<{ success: boolean; message: string }>;
  onVerifyCode: (email: string, code: string) => { success: boolean; message: string };
  getRemainingTime: (email: string) => number;
  onCodeVerified: () => void;
  disabled?: boolean;
}

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
  const [developmentCode, setDevelopmentCode] = useState('');

  const isDevelopmentMode = studentVerificationService.isDevelopmentMode();

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

    // 檢查郵件格式
    if (!email.endsWith('@ln.edu.hk') && !email.endsWith('@ln.hk')) {
      setMessage('只有 @ln.edu.hk 或 @ln.hk 郵件地址的學生才能註冊');
      setMessageType('error');
      return;
    }

    setIsSending(true);
    setMessage('');
    setDevelopmentCode('');

    try {
      const result = await onSendCode(email);
      
      if (result.success) {
        setIsCodeSent(true);
        setCountdown(600); // 10 分鐘倒數
        setMessage(result.message);
        setMessageType('success');
        
        // 在開發模式下提取驗證碼
        if (isDevelopmentMode && result.message.includes('開發模式：')) {
          const codeMatch = result.message.match(/開發模式：(\d{6})/);
          if (codeMatch) {
            setDevelopmentCode(codeMatch[1]);
          }
        }
      } else {
        setMessage(result.message);
        setMessageType('error');
      }
    } catch (error: any) {
      setMessage(error.message || '發送驗證碼失敗');
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
      const result = onVerifyCode(email, verificationCode);
      
      if (result.success) {
        setIsVerified(true);
        setMessage(result.message);
        setMessageType('success');
        setDevelopmentCode(''); // 清除開發模式顯示的驗證碼
        onCodeVerified();
      } else {
        setMessage(result.message);
        setMessageType('error');
      }
    } catch (error: any) {
      setMessage(error.message || '驗證失敗');
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
        <Label className="text-sm font-medium">學生郵件驗證</Label>
        {isDevelopmentMode && (
          <div className="flex items-center space-x-1 text-xs text-orange-600 dark:text-orange-400">
            <Code className="h-3 w-3" />
            <span>開發模式</span>
          </div>
        )}
      </div>

      {/* 開發模式提示 */}
      {isDevelopmentMode && (
        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md">
          <div className="flex items-start space-x-2">
            <Code className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div className="text-sm text-orange-600 dark:text-orange-400">
              <p className="font-medium">開發模式</p>
              <p>未設定 VITE_RESEND_API_KEY，使用模擬郵件發送</p>
            </div>
          </div>
        </div>
      )}

      {/* 發送驗證碼按鈕 */}
      <div className="space-y-2">
        <Button
          type="button"
          onClick={handleSendCode}
          disabled={disabled || !canSendCode}
          className="w-full"
          variant={isCodeSent ? "outline" : "default"}
        >
          {isSending ? (
            '發送中...'
          ) : countdown > 0 ? (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>重新發送 ({formatTime(countdown)})</span>
            </div>
          ) : isVerified ? (
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>已驗證</span>
            </div>
          ) : (
            `發送驗證碼到 ${email}`
          )}
        </Button>
      </div>

      {/* 開發模式：顯示驗證碼 */}
      {isDevelopmentMode && developmentCode && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="flex items-center space-x-2">
            <Code className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <div className="text-sm text-blue-600 dark:text-blue-400">
              <p className="font-medium">開發模式驗證碼：</p>
              <p className="font-mono text-lg font-bold tracking-widest">{developmentCode}</p>
              <p className="text-xs mt-1">請複製此驗證碼到下方輸入框</p>
            </div>
          </div>
        </div>
      )}

      {/* 驗證碼輸入 */}
      {isCodeSent && !isVerified && (
        <div className="space-y-2">
          <Label htmlFor="verificationCode" className="text-sm">
            請輸入 6 位數驗證碼
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
              {isVerifying ? '驗證中...' : '驗證'}
            </Button>
          </div>
          {/* 開發模式：快速填入按鈕 */}
          {isDevelopmentMode && developmentCode && (
            <Button
              type="button"
              onClick={() => setVerificationCode(developmentCode)}
              variant="outline"
              size="sm"
              className="w-full text-xs"
            >
              快速填入驗證碼
            </Button>
          )}
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
          <p>• 只有 @ln.edu.hk 或 @ln.hk 郵件地址才能註冊</p>
          <p>• 驗證碼有效期為 10 分鐘</p>
          <p>• 最多可嘗試驗證 3 次</p>
          {isDevelopmentMode && (
            <p className="text-orange-600 dark:text-orange-400 mt-1">
              • 開發模式：驗證碼將顯示在頁面上
            </p>
          )}
        </div>
      )}
    </div>
  );
} 