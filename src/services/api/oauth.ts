import { account } from '@/lib/appwrite';
import { OAuthProvider } from 'appwrite';

export interface OAuthLinkResult {
  success: boolean;
  message: string;
  messageKey?: string;
}

// 檢查郵箱是否為學生郵箱
const isStudentEmail = (email: string): boolean => {
  return email && (email.endsWith('@ln.hk') || email.endsWith('@ln.edu.hk'));
};

// Google OAuth 郵箱預檢查
const preCheckGoogleEmail = async (): Promise<{ isValid: boolean; email?: string }> => {
  try {
    // 使用 Google API 來獲取用戶郵箱信息，而不創建 Appwrite 會話
    // 這需要前端 Google OAuth 實現
    
    // 由於我們無法在不創建會話的情況下獲取 Google 郵箱，
    // 我們將在 OAuth 回調中立即檢查並清理
    return { isValid: true }; // 暫時允許，在回調中檢查
  } catch (error) {
    console.error('Google 郵箱預檢查失敗:', error);
    return { isValid: false };
  }
};

export const oauthService = {
  /**
   * 連結 Google 帳戶到現有用戶
   */
  async linkGoogleAccount(): Promise<void> {
    try {
      // 對於帳戶連結，我們需要使用 createOAuth2Token
      // 這會返回 token 和 userId 參數到回調 URL
      const redirectUrl = `${window.location.origin}/oauth/callback`;
      
      // 檢查用戶是否已登入（但不要因為權限錯誤而失敗）
      let currentUser = null;
      try {
        currentUser = await account.get();
        console.log('當前用戶:', currentUser?.email);
      } catch (userError) {
        console.log('無法獲取當前用戶:', userError.message);
        
        // 如果是權限錯誤，我們仍然可以嘗試創建 OAuth token
        // 因為這可能是一個「連結並登入」的操作
        if (userError.message && userError.message.includes('missing scope')) {
          console.log('檢測到權限錯誤，但仍然嘗試 OAuth 流程...');
        } else if (userError.message && userError.message.includes('User (role: guests)')) {
          console.log('用戶是 guests 角色，嘗試 OAuth 流程...');
        } else {
          // 其他類型的錯誤，可能真的需要登入
          throw new Error('User must be logged in to link Google account');
        }
      }
      
      console.log('開始 Google 帳戶連結流程...');
      
      // 使用 createOAuth2Token 來連結帳戶
      // 這個方法會觸發瀏覽器重定向，所以後續代碼可能不會執行
      await account.createOAuth2Token(
        OAuthProvider.Google,
        redirectUrl,
        redirectUrl // failure URL 也使用相同的 URL，在回調中處理錯誤
      );
      
      console.log('OAuth2Token 創建成功，應該已經重定向...');
    } catch (error: any) {
      console.error('Google 帳戶連結失敗:', error);
      
      // 檢查是否是重定向相關的錯誤（這些通常不是真正的錯誤）
      if (error.message && (
        error.message.includes('redirect') ||
        error.message.includes('navigation') ||
        error.message.includes('aborted') ||
        error.message.includes('cancelled') ||
        error.name === 'AbortError' ||
        error.name === 'NavigationError'
      )) {
        // 這些錯誤通常是由於頁面重定向導致的，不需要拋出
        console.log('檢測到重定向相關錯誤，這是正常的:', error.message);
        return;
      }
      
      // 智能錯誤檢測和處理
      if (error.message) {
        // 檢查是否是帳戶已存在的錯誤
        if (error.message.includes('user_already_exists') || 
            error.message.includes('already exists') ||
            error.code === 409) {
          const enhancedError = new Error('ACCOUNT_ALREADY_LINKED');
          enhancedError.name = 'AccountAlreadyLinkedError';
          throw enhancedError;
        }
        
        // 檢查是否是用戶未登入的錯誤（但排除權限錯誤）
        if (error.message.includes('User must be logged in') && 
            !error.message.includes('missing scope')) {
          const enhancedError = new Error('MUST_BE_LOGGED_IN');
          enhancedError.name = 'AuthenticationRequiredError';
          throw enhancedError;
        }
      }
      
      throw error;
    }
  },

  /**
   * 使用 Google 登入
   * 警告：這會創建用戶帳戶，郵箱驗證將在回調中進行
   */
  async loginWithGoogle(): Promise<void> {
    try {
      // 在開始 OAuth 流程前，顯示警告提示
      console.warn('⚠️ Google 登入提醒：只有 @ln.hk 或 @ln.edu.hk 郵箱的學生才能使用此功能');
      console.warn('⚠️ 非學生郵箱創建的帳戶將被系統自動刪除');
      
      const redirectUrl = `${window.location.origin}/oauth/login-callback`;
      
      // 創建 OAuth 會話（這會創建用戶帳戶）
      await account.createOAuth2Session(
        OAuthProvider.Google,
        redirectUrl,
        redirectUrl
      );
    } catch (error: any) {
      console.error('Google 登入失敗:', error);
      throw error;
    }
  },

  /**
   * 取消連結 Google 帳戶
   */
  async unlinkGoogleAccount(): Promise<OAuthLinkResult> {
    try {
      // 獲取當前用戶的身份提供者
      const identities = await account.listIdentities();
      
      // 查找 Google 身份提供者
      const googleIdentity = identities.identities.find(
        identity => identity.provider === 'google'
      );
      
      if (!googleIdentity) {
        return {
          success: false,
          message: 'No Google account linked',
          messageKey: 'oauth.noGoogleLinked'
        };
      }
      
      // 刪除身份提供者
      await account.deleteIdentity(googleIdentity.$id);
      
      return {
        success: true,
        message: 'Google account unlinked successfully',
        messageKey: 'oauth.unlinkSuccess'
      };
    } catch (error: any) {
      console.error('取消連結 Google 帳戶失敗:', error);
      return {
        success: false,
        message: error.message || 'Failed to unlink Google account',
        messageKey: 'oauth.unlinkFailed'
      };
    }
  },

  /**
   * 檢查用戶是否已連結 Google 帳戶
   */
  async isGoogleLinked(): Promise<boolean> {
    try {
      const identities = await account.listIdentities();
      console.log('當前身份提供者:', identities.identities.map(id => ({ provider: id.provider, email: id.providerEmail })));
      
      const hasGoogle = identities.identities.some(
        identity => identity.provider === 'google'
      );
      
      console.log('是否有 Google 身份提供者:', hasGoogle);
      return hasGoogle;
    } catch (error) {
      console.error('檢查 Google 連結狀態失敗:', error);
      return false;
    }
  },

  /**
   * 獲取連結的 Google 帳戶信息
   */
  async getGoogleAccountInfo(): Promise<any> {
    try {
      const identities = await account.listIdentities();
      const googleIdentity = identities.identities.find(
        identity => identity.provider === 'google'
      );
      
      return googleIdentity || null;
    } catch (error) {
      console.error('獲取 Google 帳戶信息失敗:', error);
      return null;
    }
  },

  /**
   * 檢查郵箱是否為學生郵箱
   */
  isStudentEmail,

  /**
   * 驗證當前用戶的郵箱是否為學生郵箱
   */
  async validateCurrentUserEmail(): Promise<boolean> {
    try {
      const user = await account.get();
      return isStudentEmail(user.email);
    } catch (error) {
      console.error('驗證用戶郵箱失敗:', error);
      return false;
    }
  },

  /**
   * 強制清理當前非學生用戶會話
   */
  async forceCleanupNonStudentSession(): Promise<void> {
    try {
      const user = await account.get();
      if (user && !isStudentEmail(user.email)) {
        console.warn('檢測到非學生郵箱會話，立即清理:', user.email);
        await account.deleteSession('current');
        
        // 調用清理函數
        try {
          await fetch(`https://fra.cloud.appwrite.io/v1/functions/cleanup-expired-codes/executions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Appwrite-Project': 'lingubible',
            },
            body: JSON.stringify({
              body: JSON.stringify({
                action: 'immediate_cleanup',
                userId: user.$id,
                email: user.email,
                reason: 'non_student_email_force_cleanup'
              }),
              async: false,
              method: 'POST'
            }),
          });
        } catch (cleanupError) {
          console.error('調用清理函數失敗:', cleanupError);
        }
      }
    } catch (error) {
      console.error('強制清理會話失敗:', error);
    }
  }
}; 