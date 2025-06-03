import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordStrengthChecker } from './PasswordStrengthChecker';
import { useLanguage } from '@/contexts/LanguageContext';

export function PasswordDemo() {
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('student@ln.edu.hk');
  const [isValid, setIsValid] = useState(false);
  const { t } = useLanguage();

  const testPasswords = [
    { label: '弱密碼 (常用)', value: '123456' },
    { label: '弱密碼 (缺少數字)', value: 'MyPassword!' },
    { label: '弱密碼 (缺少大寫)', value: 'mypassword123!' },
    { label: '中等密碼 (8字符)', value: 'MyPass1!' },
    { label: '中等密碼 (有警告)', value: 'MyPassword1!' },
    { label: '良好密碼 (10字符)', value: 'MySecure1!' },
    { label: '強密碼 (12+字符)', value: 'MyVerySecure123!' },
    { label: '洩露模式', value: 'password123' }
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>密碼強度檢查器演示</CardTitle>
          <CardDescription>
            測試不同的密碼來查看安全性檢查功能（現在數字為必需要求）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">郵件地址</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@ln.edu.hk"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密碼</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="輸入密碼來測試強度"
            />
          </div>

          {password && (
            <PasswordStrengthChecker
              password={password}
              email={email}
              onValidationChange={setIsValid}
            />
          )}

          <div className="pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              快速測試密碼：
            </p>
            <div className="grid grid-cols-2 gap-2">
              {testPasswords.map((test, index) => (
                <button
                  key={index}
                  onClick={() => setPassword(test.value)}
                  className="text-left p-2 text-sm bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {test.label}
                </button>
              ))}
            </div>
          </div>

          {password && (
            <div className="pt-4 border-t">
              <p className={`text-sm font-medium ${
                isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                驗證結果: {isValid ? '✅ 密碼符合安全要求' : '❌ 密碼不符合安全要求'}
              </p>
              <div className="mt-2 text-xs text-gray-500">
                <p>新要求：數字現在是必需的，不再是建議</p>
                <p>支援多語言：英文、繁體中文、簡體中文</p>
                <p>學校郵件提醒：對 @ln.edu.hk 和 @ln.hk 用戶始終顯示</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 