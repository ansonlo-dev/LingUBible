import { account } from '@/lib/appwrite';
import { OAuthProvider } from 'appwrite';

export interface OAuthLinkResult {
  success: boolean;
  message: string;
  messageKey?: string;
}

export const oauthService = {
  /**
   * 連結 Google 帳戶到現有用戶
   */
  async linkGoogleAccount(): Promise<void> {
    try {
      // 對於帳戶連結，我們需要使用 createOAuth2Token
      // 這會返回 token 和 userId 參數到回調 URL
      const redirectUrl = `${window.location.origin}/oauth/callback`;
      
      // 檢查用戶是否已登入
      const currentUser = await account.get();
      if (!currentUser) {
        throw new Error('User must be logged in to link Google account');
      }
      
      // 使用 createOAuth2Token 來連結帳戶
      await account.createOAuth2Token(
        OAuthProvider.Google,
        redirectUrl,
        redirectUrl // failure URL 也使用相同的 URL，在回調中處理錯誤
      );
    } catch (error: any) {
      console.error('Google 帳戶連結失敗:', error);
      
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
        
        // 檢查是否是用戶未登入的錯誤
        if (error.message.includes('User must be logged in')) {
          const enhancedError = new Error('MUST_BE_LOGGED_IN');
          enhancedError.name = 'AuthenticationRequiredError';
          throw enhancedError;
        }
      }
      
      throw error;
    }
  },

  /**
   * 使用 Google 登入（僅限已連結的帳戶）
   */
  async loginWithGoogle(): Promise<void> {
    try {
      const redirectUrl = `${window.location.origin}/oauth/login-callback`;
      
      await account.createOAuth2Session(
        OAuthProvider.Google,
        redirectUrl,
        redirectUrl
      );
    } catch (error) {
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
      return identities.identities.some(
        identity => identity.provider === 'google'
      );
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
  }
}; 