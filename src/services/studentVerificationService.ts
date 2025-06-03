import { Resend } from 'resend';
import { render } from '@react-email/render';
import { VerificationEmail } from '../emails/VerificationEmail';
import React from 'react';

// 檢查是否為開發模式（沒有 API 金鑰）
const isDevelopmentMode = !import.meta.env.VITE_RESEND_API_KEY;

// 初始化 Resend（只在有 API 金鑰時）
const resend = isDevelopmentMode ? null : new Resend(import.meta.env.VITE_RESEND_API_KEY);

// 驗證碼存儲接口
interface VerificationCode {
  code: string;
  email: string;
  expiresAt: Date;
  attempts: number;
  isVerified: boolean;
}

class StudentVerificationService {
  private verificationCodes = new Map<string, VerificationCode>();
  private readonly MAX_ATTEMPTS = 3;
  private readonly CODE_EXPIRY_MINUTES = 10;
  private readonly ALLOWED_DOMAINS = ['@ln.edu.hk', '@ln.hk'];

  // 檢查郵件是否為有效的學生郵件
  private isValidStudentEmail(email: string): boolean {
    return this.ALLOWED_DOMAINS.some(domain => email.toLowerCase().endsWith(domain.toLowerCase()));
  }

  // 生成 6 位數驗證碼
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 模擬郵件發送（開發模式）
  private async simulateEmailSending(email: string, code: string): Promise<{ success: boolean; message: string }> {
    console.log('🔧 開發模式：模擬發送郵件');
    console.log(`📧 收件人：${email}`);
    console.log(`🔢 驗證碼：${code}`);
    console.log('💡 提示：在生產環境中請設定 VITE_RESEND_API_KEY 環境變數');
    
    // 模擬網路延遲
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: `驗證碼已發送到您的學生信箱（開發模式：${code}）`
    };
  }

  // 發送驗證碼郵件
  async sendVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // 檢查是否為有效的學生郵件
      if (!this.isValidStudentEmail(email)) {
        return {
          success: false,
          message: '只有 @ln.edu.hk 或 @ln.hk 郵件地址的學生才能註冊'
        };
      }

      // 檢查是否已有未過期的驗證碼
      const existingCode = this.verificationCodes.get(email);
      if (existingCode && existingCode.expiresAt > new Date()) {
        const remainingMinutes = Math.ceil((existingCode.expiresAt.getTime() - Date.now()) / (1000 * 60));
        return {
          success: false,
          message: `驗證碼已發送，請檢查您的信箱或等待 ${remainingMinutes} 分鐘後重新發送`
        };
      }

      // 生成新的驗證碼
      const code = this.generateVerificationCode();
      const expiresAt = new Date(Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000);

      // 存儲驗證碼
      this.verificationCodes.set(email, {
        code,
        email,
        expiresAt,
        attempts: 0,
        isVerified: false
      });

      // 開發模式：模擬發送郵件
      if (isDevelopmentMode) {
        return await this.simulateEmailSending(email, code);
      }

      // 生產模式：實際發送郵件
      try {
        // 渲染郵件模板
        const emailHtml = await render(React.createElement(VerificationEmail, {
          verificationCode: code,
          userEmail: email
        }));

        // 發送郵件
        const { data, error } = await resend!.emails.send({
          from: 'LingUBible <noreply@lingubible.com>',
          to: [email],
          subject: '您的 LingUBible 學生驗證碼',
          html: emailHtml,
        });

        if (error) {
          console.error('發送郵件失敗:', error);
          return {
            success: false,
            message: '發送郵件失敗，請稍後再試'
          };
        }

        console.log('郵件發送成功:', data);
        return {
          success: true,
          message: '驗證碼已發送到您的學生信箱，請檢查郵件'
        };
      } catch (emailError) {
        console.error('郵件發送錯誤:', emailError);
        return {
          success: false,
          message: '郵件發送失敗，請檢查 API 設定'
        };
      }

    } catch (error) {
      console.error('郵件服務錯誤:', error);
      return {
        success: false,
        message: '郵件服務暫時不可用，請稍後再試'
      };
    }
  }

  // 驗證驗證碼
  verifyCode(email: string, inputCode: string): { success: boolean; message: string } {
    const storedCode = this.verificationCodes.get(email);

    if (!storedCode) {
      return {
        success: false,
        message: '請先發送驗證碼'
      };
    }

    // 檢查是否過期
    if (storedCode.expiresAt < new Date()) {
      this.verificationCodes.delete(email);
      return {
        success: false,
        message: '驗證碼已過期，請重新發送'
      };
    }

    // 檢查嘗試次數
    if (storedCode.attempts >= this.MAX_ATTEMPTS) {
      this.verificationCodes.delete(email);
      return {
        success: false,
        message: '驗證失敗次數過多，請重新發送驗證碼'
      };
    }

    // 驗證碼錯誤
    if (storedCode.code !== inputCode) {
      storedCode.attempts++;
      return {
        success: false,
        message: `驗證碼錯誤，還有 ${this.MAX_ATTEMPTS - storedCode.attempts} 次機會`
      };
    }

    // 驗證成功，標記為已驗證但不刪除（註冊時需要檢查）
    storedCode.isVerified = true;
    return {
      success: true,
      message: '郵件驗證成功！現在可以設定密碼完成註冊'
    };
  }

  // 檢查郵件是否已驗證
  isEmailVerified(email: string): boolean {
    const storedCode = this.verificationCodes.get(email);
    return storedCode?.isVerified === true && storedCode.expiresAt > new Date();
  }

  // 完成註冊後清理驗證碼
  clearVerificationCode(email: string): void {
    this.verificationCodes.delete(email);
  }

  // 獲取剩餘時間（秒）
  getRemainingTime(email: string): number {
    const storedCode = this.verificationCodes.get(email);
    if (!storedCode) return 0;

    const remaining = Math.max(0, Math.floor((storedCode.expiresAt.getTime() - Date.now()) / 1000));
    return remaining;
  }

  // 清理過期的驗證碼
  private cleanupExpiredCodes() {
    const now = new Date();
    for (const [email, code] of this.verificationCodes.entries()) {
      if (code.expiresAt < now) {
        this.verificationCodes.delete(email);
      }
    }
  }

  // 檢查是否為開發模式
  isDevelopmentMode(): boolean {
    return isDevelopmentMode;
  }

  constructor() {
    // 每分鐘清理一次過期的驗證碼
    setInterval(() => {
      this.cleanupExpiredCodes();
    }, 60 * 1000);

    // 開發模式提示
    if (isDevelopmentMode) {
      console.log('🔧 學生驗證服務運行在開發模式');
      console.log('💡 要啟用實際郵件發送，請設定 VITE_RESEND_API_KEY 環境變數');
    }
  }
}

export const studentVerificationService = new StudentVerificationService(); 