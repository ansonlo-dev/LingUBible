import { account, ID } from '../lib/appwrite';
import { Models } from 'appwrite';

export interface AuthUser extends Models.User<Models.Preferences> {}

export const authService = {
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
        } catch (error) {
            return null;
        }
    },

    // 登出
    async logout() {
        try {
            await account.deleteSession('current');
        } catch (error) {
            throw error;
        }
    },

    // 檢查用戶是否已登入
    async isLoggedIn() {
        try {
            await account.get();
            return true;
        } catch {
            return false;
        }
    }
}; 