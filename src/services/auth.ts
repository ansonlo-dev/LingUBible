import { account, ID } from '../lib/appwrite';
import { Models } from 'appwrite';
import { studentVerificationService } from './studentVerificationService';

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

    // 發送學生驗證碼
    async sendStudentVerificationCode(email: string) {
        try {
            return await studentVerificationService.sendVerificationCode(email);
        } catch (error) {
            console.error('發送驗證碼錯誤:', error);
            return {
                success: false,
                message: '發送驗證碼失敗，請稍後再試'
            };
        }
    },

    // 驗證學生驗證碼
    verifyStudentCode(email: string, code: string) {
        try {
            return studentVerificationService.verifyCode(email, code);
        } catch (error) {
            console.error('驗證驗證碼錯誤:', error);
            return {
                success: false,
                message: '驗證失敗，請稍後再試'
            };
        }
    },

    // 檢查學生郵件是否已驗證
    isStudentEmailVerified(email: string): boolean {
        try {
            return studentVerificationService.isEmailVerified(email);
        } catch (error) {
            console.error('檢查驗證狀態錯誤:', error);
            return false;
        }
    },

    // 獲取驗證碼剩餘時間
    getVerificationRemainingTime(email: string): number {
        try {
            return studentVerificationService.getRemainingTime(email);
        } catch (error) {
            console.error('獲取剩餘時間錯誤:', error);
            return 0;
        }
    },

    // 註冊新用戶（需要先驗證學生郵件）
    async createAccount(email: string, password: string, name: string) {
        try {
            // 檢查是否已驗證學生郵件
            if (!this.isStudentEmailVerified(email)) {
                throw new Error('請先驗證您的學生郵件地址');
            }

            const newAccount = await account.create(
                ID.unique(),
                email,
                password,
                name
            );
            
            if (newAccount) {
                // 清理驗證碼
                try {
                    studentVerificationService.clearVerificationCode(email);
                } catch (error) {
                    console.warn('清理驗證碼失敗:', error);
                }
                
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
    async login(email: string, password: string, rememberMe: boolean = false) {
        try {
            // 創建 session
            const session = await account.createEmailPasswordSession(email, password);
            
            // 如果不選擇記住我，設置 session 為瀏覽器關閉時過期
            if (!rememberMe) {
                // 保存記住我狀態到 localStorage
                localStorage.setItem('rememberMe', 'false');
                // 設置一個標記，在頁面刷新時檢查
                sessionStorage.setItem('sessionOnly', 'true');
            } else {
                // 記住我：保存狀態並移除 sessionOnly 標記
                localStorage.setItem('rememberMe', 'true');
                localStorage.setItem('savedEmail', email);
                sessionStorage.removeItem('sessionOnly');
            }
            
            return session;
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
            
            // 清理記住我相關的存儲
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('savedEmail');
            sessionStorage.removeItem('sessionOnly');
        } catch (error) {
            // 即使登出失敗也不拋出錯誤，因為可能已經登出了
            console.warn('Logout error:', error);
            
            // 仍然清理本地存儲
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('savedEmail');
            sessionStorage.removeItem('sessionOnly');
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