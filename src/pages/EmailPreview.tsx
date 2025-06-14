import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Eye, Mail, Palette, Code, Lock, MessageSquare } from 'lucide-react';

// Import email template generators
import { 
  generateEmailTemplate, 
  generatePasswordResetEmailTemplate, 
  generateContactFormEmailTemplate 
} from '@/utils/email-templates';

export default function EmailPreview() {
  const [emailType, setEmailType] = useState('verification');
  const [language, setLanguage] = useState('zh-TW');
  const [theme, setTheme] = useState('light');
  const [previewHtml, setPreviewHtml] = useState('');
  
  // Form data for different email types
  const [verificationCode, setVerificationCode] = useState('123456');
  const [userId, setUserId] = useState('user123');
  const [resetToken, setResetToken] = useState('reset-token-123');
  const [username, setUsername] = useState('John');
  const [contactName, setContactName] = useState('張三');
  const [contactEmail, setContactEmail] = useState('test@example.com');
  const [contactMessage, setContactMessage] = useState('這是一個測試訊息，用來預覽聯絡表單郵件的外觀。這個訊息包含足夠的文字來測試郵件模板的排版和樣式。');

  const generatePreview = () => {
    let template;
    
    switch (emailType) {
      case 'verification':
        template = generateEmailTemplate(verificationCode, language, theme);
        break;
      case 'password-reset':
        template = generatePasswordResetEmailTemplate(userId, resetToken, username, language, theme);
        break;
      case 'contact-form':
        template = generateContactFormEmailTemplate(contactName, contactEmail, contactMessage, language, theme);
        break;
      default:
        template = { html: '<p>請選擇郵件類型</p>' };
    }
    
    setPreviewHtml(template.html);
  };

  const emailTypes = [
    { value: 'verification', label: '驗證碼郵件', icon: Code },
    { value: 'password-reset', label: '密碼重設郵件', icon: Lock },
    { value: 'contact-form', label: '聯絡表單郵件', icon: MessageSquare }
  ];

  const languages = [
    { value: 'zh-TW', label: '繁體中文' },
    { value: 'zh-CN', label: '簡體中文' },
    { value: 'en', label: 'English' }
  ];

  const themes = [
    { value: 'light', label: '亮色主題', color: 'bg-white' },
    { value: 'dark', label: '暗色主題', color: 'bg-gray-900' }
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Mail className="h-8 w-8 text-primary" />
            郵件模板預覽工具
          </h1>
          <p className="text-muted-foreground">
            在本地預覽所有郵件模板，無需實際發送郵件
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  設定選項
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Email Type */}
                <div className="space-y-2">
                  <Label>郵件類型</Label>
                  <Select value={emailType} onValueChange={setEmailType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {emailTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <Label>語言</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Theme */}
                <div className="space-y-2">
                  <Label>主題</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {themes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${t.color} border`} />
                            {t.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dynamic Form Fields */}
                {emailType === 'verification' && (
                  <div className="space-y-2">
                    <Label>驗證碼</Label>
                    <Input
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="輸入驗證碼"
                    />
                  </div>
                )}

                {emailType === 'password-reset' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>用戶名</Label>
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="輸入用戶名"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>用戶 ID</Label>
                      <Input
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="輸入用戶 ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>重設令牌</Label>
                      <Input
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        placeholder="輸入重設令牌"
                      />
                    </div>
                  </div>
                )}

                {emailType === 'contact-form' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>聯絡人姓名</Label>
                      <Input
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="輸入姓名"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>聯絡人郵件</Label>
                      <Input
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="輸入郵件地址"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>訊息內容</Label>
                      <Textarea
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="輸入訊息內容"
                        rows={4}
                      />
                    </div>
                  </div>
                )}

                {/* Generate Button */}
                <Button 
                  onClick={generatePreview} 
                  className="w-full"
                  size="lg"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  生成預覽
                </Button>

                {/* Current Settings Display */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {emailTypes.find(t => t.value === emailType)?.label}
                    </Badge>
                    <Badge variant="outline">
                      {languages.find(l => l.value === language)?.label}
                    </Badge>
                    <Badge variant={theme === 'dark' ? 'default' : 'secondary'}>
                      {themes.find(t => t.value === theme)?.label}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">使用說明</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>1. 選擇要預覽的郵件類型</p>
                <p>2. 設定語言和主題</p>
                <p>3. 填寫相關參數</p>
                <p>4. 點擊「生成預覽」查看效果</p>
                <p>5. 預覽窗口會顯示實際的郵件外觀</p>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  郵件預覽
                  {theme === 'dark' && (
                    <Badge variant="default" className="ml-auto">
                      暗色主題
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {previewHtml ? (
                  <div className="border rounded-lg overflow-hidden">
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full h-[800px] border-0"
                      title="Email Preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[800px] text-muted-foreground">
                    <div className="text-center space-y-2">
                      <Mail className="h-12 w-12 mx-auto opacity-50" />
                      <p>請選擇設定並點擊「生成預覽」來查看郵件</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>此工具僅用於本地預覽，不會實際發送郵件</p>
        </div>
      </div>
    </div>
  );
} 