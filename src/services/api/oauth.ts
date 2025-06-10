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
      // 創建 OAuth2 session 來連結帳戶
      // 這會重定向到 Google 授權頁面
      const redirectUrl = `${window.location.origin}/oauth/callback`;
      
      await account.createOAuth2Token(
        OAuthProvider.Google,
        redirectUrl,
        redirectUrl // failure URL 也使用相同的 URL，在回調中處理錯誤
      );
    } catch (error) {
      console.error('Google 帳戶連結失敗:', error);
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