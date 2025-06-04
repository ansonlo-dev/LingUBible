// 移除前端的 Resend 導入，改為調用後端 API
// import { Resend } from 'resend';
// import { render } from '@react-email/render';
// import { VerificationEmail } from '../emails/VerificationEmail';
// import React from 'react';

// 簡化的學生驗證服務 - 使用 Appwrite 資料庫存儲，所有邏輯在後端

class StudentVerificationService {
  private readonly ALLOWED_DOMAINS = ['@ln.edu.hk', '@ln.hk'];

  // 檢查郵件是否為有效的學生郵件
  private isValidStudentEmail(email: string): boolean {
    const emailLower = email.toLowerCase();
    // 使用正則表達式確保完全匹配，防止像 abc@ln.edsf.hk 這樣的郵件通過
    const validEmailPattern = /^[a-zA-Z0-9._%+-]+@(ln\.edu\.hk|ln\.hk)$/;
    return validEmailPattern.test(emailLower);
  }

  // 獲取用戶的 IP 地址和 User Agent（用於安全追蹤）
  private async getUserInfo() {
    try {
      // 獲取用戶 IP（如果可用）
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      
      return {
        ipAddress: ipData.ip || null,
        userAgent: navigator.userAgent || null
      };
    } catch (error) {
      console.warn('無法獲取用戶信息:', error);
      return {
        ipAddress: null,
        userAgent: navigator.userAgent || null
      };
    }
  }

  // 調用 Appwrite Function
  private async callFunction(action: 'send' | 'verify', email: string, code?: string, language?: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🚀 開始${action === 'send' ? '發送' : '驗證'}流程:`, { email, action });
      
      // 獲取用戶信息用於安全追蹤
      const userInfo = await this.getUserInfo();
      
      // 準備請求數據
      const requestData = { 
        action,
        email,
        ...(code && { code }),
        ...(language && { language }),
        ...userInfo
      };
      
      console.log('📦 準備發送的數據:', requestData);
      
      // 調用 Appwrite Function
      const response = await fetch(`https://fra.cloud.appwrite.io/v1/functions/send-verification/executions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': 'lingubible',
        },
        body: JSON.stringify({
          body: JSON.stringify(requestData),
          async: false,
          method: 'POST'
        }),
      });

      console.log('📡 API 回應狀態:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API 調用失敗:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        if (response.status === 401) {
          return {
            success: false,
            message: '權限錯誤：請檢查 Function 執行權限設定'
          };
        } else if (response.status === 404) {
          return {
            success: false,
            message: 'Function 不存在或未部署'
          };
        } else if (response.status === 500) {
          return {
            success: false,
            message: '伺服器內部錯誤，請稍後再試'
          };
        } else {
          return {
            success: false,
            message: `${action === 'send' ? '發送' : '驗證'}失敗 (${response.status}): ${errorText}`
          };
        }
      }

      const result = await response.json();
      console.log('✅ API 回應結果:', result);

      if (result.status === 'completed') {
        if (result.responseStatusCode === 200) {
          try {
            const functionResponse = JSON.parse(result.responseBody);
            console.log(`📧 Function 執行結果:`, functionResponse);
            
            return {
              success: functionResponse.success,
              message: functionResponse.message || (functionResponse.success ? `${action === 'send' ? '驗證碼已發送' : '驗證成功'}` : `${action === 'send' ? '發送' : '驗證'}失敗`)
            };
          } catch (parseError) {
            console.error('❌ 解析 Function 回應失敗:', parseError);
            return {
              success: false,
              message: `Function 回應解析失敗: ${result.responseBody}`
            };
          }
        } else {
          console.error('❌ Function HTTP 錯誤:', {
            statusCode: result.responseStatusCode,
            body: result.responseBody,
            stderr: result.stderr
          });
          
          // 嘗試解析 responseBody 中的錯誤訊息
          let errorMessage = '未知錯誤';
          try {
            if (result.responseBody) {
              const errorResponse = JSON.parse(result.responseBody);
              errorMessage = errorResponse.message || result.responseBody;
            } else {
              errorMessage = result.stderr || '未知錯誤';
            }
          } catch (parseError) {
            // 如果解析失敗，使用原始內容
            errorMessage = result.responseBody || result.stderr || '未知錯誤';
          }
          
          return {
            success: false,
            message: errorMessage
          };
        }
      } else if (result.status === 'failed') {
        console.error('❌ Function 執行失敗:', {
          error: result.error,
          stderr: result.stderr,
          stdout: result.stdout
        });
        return {
          success: false,
          message: `Function 執行失敗: ${result.error || result.stderr || '未知錯誤'}`
        };
      } else {
        console.error('❌ Function 狀態異常:', result);
        return {
          success: false,
          message: `Function 狀態異常 (${result.status}): ${result.error || result.stderr || '未知錯誤'}`
        };
      }

    } catch (error) {
      console.error('💥 網路請求異常:', error);
      return {
        success: false,
        message: `網路連接失敗: ${error instanceof Error ? error.message : '未知錯誤'}`
      };
    }
  }

  // 檢查是否為開發模式（現在總是返回 false，因為使用安全的後端驗證）
  isDevelopmentMode(): boolean {
    return false;
  }

  // 發送驗證碼郵件（支援多語言）
  async sendVerificationCode(email: string, language: string = 'zh-TW'): Promise<{ success: boolean; message: string }> {
    try {
      // 檢查郵件格式
      if (!this.isValidStudentEmail(email)) {
        const messages = {
          'en': 'Only @ln.edu.hk or @ln.hk email addresses can register',
          'zh-TW': '只有 @ln.edu.hk 或 @ln.hk 郵件地址的學生才能註冊',
          'zh-CN': '只有 @ln.edu.hk 或 @ln.hk 邮件地址的学生才能注册'
        };
        return {
          success: false,
          message: messages[language] || messages['zh-TW']
        };
      }

      // 調用後端 API 發送驗證碼
      return await this.callFunction('send', email, undefined, language);

    } catch (error) {
      console.error('郵件服務錯誤:', error);
      return {
        success: false,
        message: '郵件服務暫時不可用，請稍後再試'
      };
    }
  }

  // 驗證驗證碼（使用後端驗證）
  async verifyCode(email: string, inputCode: string): Promise<{ success: boolean; message: string }> {
    try {
      // 基本參數檢查
      if (!email || !inputCode) {
        return {
          success: false,
          message: '請提供郵件地址和驗證碼'
        };
      }

      if (inputCode.length !== 6 || !/^\d{6}$/.test(inputCode)) {
        return {
          success: false,
          message: '驗證碼必須是 6 位數字'
        };
      }

      // 調用後端 API 進行驗證
      return await this.callFunction('verify', email, inputCode);

    } catch (error) {
      console.error('驗證碼驗證錯誤:', error);
      return {
        success: false,
        message: '驗證失敗，請稍後再試'
      };
    }
  }

  // 檢查郵件是否已驗證（需要調用後端 API）
  async isEmailVerified(email: string): Promise<boolean> {
    // 注意：這個方法現在需要是異步的，因為需要查詢後端
    // 在實際使用中，建議在驗證成功後在前端暫存驗證狀態
    console.warn('isEmailVerified 方法需要後端 API 支援，目前返回 false');
    return false;
  }

  // 清理驗證碼（現在由後端自動處理）
  clearVerificationCode(email: string): void {
    console.log('驗證碼清理現在由後端自動處理');
  }

  // 獲取驗證碼剩餘時間（需要後端 API 支援）
  getRemainingTime(email: string): number {
    // 注意：這個方法現在需要後端 API 支援
    // 在當前實現中，倒數計時由前端 UI 組件處理
    console.warn('getRemainingTime 方法需要後端 API 支援，目前返回 0');
    return 0;
  }

  // 檢查郵件是否已註冊（保持原有邏輯）
  isEmailAlreadyRegistered(email: string): boolean {
    // 在實際應用中，這應該是一個 API 調用來檢查數據庫
    const registeredEmails = [
      'test@ln.edu.hk',
      'admin@ln.edu.hk',
      'student@ln.edu.hk',
      'demo@ln.hk',
      'user@ln.edu.hk'
    ];
    
    return registeredEmails.includes(email.toLowerCase());
  }
}

// 導出單例實例
export const studentVerificationService = new StudentVerificationService(); 