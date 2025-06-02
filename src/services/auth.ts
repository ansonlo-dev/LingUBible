import { account, ID } from '../lib/appwrite';
import { Models } from 'appwrite';

export interface AuthUser extends Models.User<Models.Preferences> {}

export const authService = {
    // 檢查是否有本地 session（避免 API 調用）
    hasLocalSession() {
        try {
            // Appwrite 會在 localStorage 中存儲 session 信息
            const cookieString = document.cookie;
            return cookieString.includes('a_session_') || 
                   localStorage.getItem('cookieFallback') !== null;
        } catch {
            return false;
        }
    },

    // 註冊新用戶
    async createAccount(email: string, password: string, name: string) {
        try {
            const newAccount = await account.create(
                ID.unique(),
                email,
                password,
                name
            );
            
            if (newAccount) {
                // 登入新創建的帳戶
                return await this.login(email, password);
            } else {
                throw new Error('帳戶創建失敗');
            }
        } catch (error) {
            throw error;
        }
    },

    // 登入
    async login(email: string, password: string) {
        try {
            return await account.createEmailPasswordSession(email, password);
        } catch (error) {
            throw error;
        }
    },

    // 獲取當前用戶
    async getCurrentUser() {
        try {
            return await account.get();
        } catch (error: any) {
            // 靜默處理未授權錯誤（401），這是正常的未登入狀態
            if (error?.status === 401 || error?.code === 401 || 
                error?.message?.includes('401') || 
                error?.message?.includes('Unauthorized')) {
                return null;
            }
            // 對於其他錯誤，仍然記錄但不拋出
            console.warn('Auth error:', error);
            return null;
        }
    },

    // 登出
    async logout() {
        try {
            await account.deleteSession('current');
        } catch (error) {
            // 即使登出失敗也不拋出錯誤，因為可能已經登出了
            console.warn('Logout error:', error);
        }
    },

    // 檢查用戶是否已登入
    async isLoggedIn() {
        try {
            await account.get();
            return true;
        } catch (error: any) {
            // 靜默處理未授權錯誤
            if (error?.status === 401 || error?.code === 401 || 
                error?.message?.includes('401') || 
                error?.message?.includes('Unauthorized')) {
                return false;
            }
            console.warn('Auth check error:', error);
            return false;
        }
    }
}; 