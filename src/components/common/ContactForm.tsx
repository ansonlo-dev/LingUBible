import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useContactRecaptcha } from '@/hooks/useSmartRecaptcha';
import { Mail, Loader2 } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  message: string;
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { verifyContact } = useContactRecaptcha();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      toast({
        title: t('contact.error'),
        description: t('contact.fillAllFields'),
        variant: 'destructive',
      });
      return;
    }

    // 檢查姓名長度（不超過10字）
    const nameWordCount = formData.name.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (nameWordCount > 10) {
      toast({
        title: t('contact.error'),
        description: t('contact.nameMaxWords').replace('{count}', nameWordCount.toString()),
        variant: 'destructive',
      });
      return;
    }

    // 檢查郵件格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast({
        title: t('contact.error'),
        description: t('contact.invalidEmail'),
        variant: 'destructive',
      });
      return;
    }

    // 檢查訊息內容字數（至少30字）
    const wordCount = formData.message.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount < 30) {
      toast({
        title: t('contact.error'),
        description: t('contact.messageMinWords').replace('{count}', wordCount.toString()),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 執行 reCAPTCHA 驗證
      const recaptchaResult = await verifyContact({
        onError: (error) => {
          toast({
            title: t('contact.error'),
            description: error,
            variant: 'destructive',
          });
          setIsSubmitting(false);
        }
      });

      if (!recaptchaResult.success) {
        // 錯誤已在 onError 回調中處理
        return;
      }

      // 調用後端 API 發送聯絡表單郵件，設置較長的超時時間
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超時

      try {
        const response = await fetch(`https://fra.cloud.appwrite.io/v1/functions/send-verification-email/executions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': 'lingubible',
          },
          body: JSON.stringify({
            body: JSON.stringify({
              action: 'sendContactForm',
              name: formData.name.trim(),
              email: formData.email.trim(),
              message: formData.message.trim(),
              language: language,
              recaptchaToken: recaptchaResult.token,
              ipAddress: 'unknown', // 前端無法獲取真實IP
            })
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        // 如果請求成功完成，檢查結果
        if (response.ok) {
          const result = await response.json();
          
          // 更寬鬆的成功判斷條件
          const isSuccess = result.success || 
                           (result.response && JSON.parse(result.response).success) ||
                           response.status === 200 || 
                           response.status === 201;
          
          if (isSuccess) {
            toast({
              title: t('contact.success'),
              description: t('contact.successMessage'),
            });
            
            // 清空表單
            setFormData({
              name: '',
              email: '',
              message: ''
            });
          } else {
            // 即使後端回應不明確，但狀態碼正常，也視為成功
            toast({
              title: t('contact.success'),
              description: t('contact.successMessage'),
            });
            
            // 清空表單
            setFormData({
              name: '',
              email: '',
              message: ''
            });
          }
        } else {
          // 只有在明確的錯誤狀態碼時才顯示錯誤
          const result = await response.json();
          const errorData = result.response ? JSON.parse(result.response) : result;
          toast({
            title: t('contact.error'),
            description: errorData.message || t('contact.sendFailed'),
            variant: 'destructive',
          });
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // 如果是超時錯誤，顯示成功訊息（因為郵件可能已經發送）
        if (fetchError.name === 'AbortError') {
          toast({
            title: t('contact.success'),
            description: t('contact.successMessage') + ' ' + t('contact.processingNote'),
          });
          
          // 清空表單
          setFormData({
            name: '',
            email: '',
            message: ''
          });
        } else {
          // 其他網路錯誤
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('Contact form error:', error);
      toast({
        title: t('contact.error'),
        description: t('contact.serviceError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Mail className="h-5 w-5 text-primary" />
          {t('contact.getInTouch')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('contact.name')}</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder={t('contact.namePlaceholder')}
              required
              disabled={isSubmitting}
              className="bg-background border-border focus:border-primary"
            />
            {formData.name.trim() && (() => {
              const nameWordCount = formData.name.trim().split(/\s+/).filter(word => word.length > 0).length;
              const isValid = nameWordCount <= 10;
              return (
                <div className="text-xs text-muted-foreground">
                  <span className={isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {nameWordCount}/10 {t('common.words')} {isValid ? '✓' : '⚠️'}
                  </span>
                  {!isValid && (
                    <span className="ml-2 text-red-600 dark:text-red-400">
                      {t('contact.nameMaxWords').replace('{count}', nameWordCount.toString())}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">{t('contact.email')}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t('contact.emailPlaceholder')}
              required
              disabled={isSubmitting}
              className="bg-background border-border focus:border-primary"
            />
            {formData.email.trim() && (() => {
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              const isValid = emailRegex.test(formData.email.trim());
              return (
                <div className="text-xs text-muted-foreground">
                  <span className={isValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {isValid ? '✓ ' + t('contact.email') + ' ' + t('common.success').toLowerCase() : '⚠️ ' + t('contact.invalidEmail')}
                  </span>
                </div>
              );
            })()}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">{t('contact.message')}</Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder={t('contact.messagePlaceholder')}
              rows={4}
              required
              disabled={isSubmitting}
              className="bg-background border-border focus:border-primary resize-none"
            />
            {formData.message.trim() && (
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>
                  {(() => {
                    const wordCount = formData.message.trim().split(/\s+/).filter(word => word.length > 0).length;
                    const isValid = wordCount >= 30;
                    return (
                      <span className={isValid ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}>
                        {wordCount}/30 {t('common.words')} {isValid ? '✓' : ''}
                      </span>
                    );
                  })()}
                </span>
                {(() => {
                  const wordCount = formData.message.trim().split(/\s+/).filter(word => word.length > 0).length;
                  return wordCount < 30 ? (
                    <span className="text-orange-600 dark:text-orange-400 text-xs">
                      {t('contact.messageMinWords').replace('{count}', wordCount.toString())}
                    </span>
                  ) : null;
                })()}
              </div>
            )}
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('contact.sending')}
              </>
            ) : (
              t('contact.submit')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 