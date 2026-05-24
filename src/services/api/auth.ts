import { account, ID } from '@/lib/appwrite';
import { Models } from 'appwrite';
import { studentVerificationService } from '@/services/external/studentVerification';
import { DEV_MODE } from '@/config/devMode';
import { UsernameValidator } from '@/utils/auth/usernameValidator';

// 導入 CourseService 來更新評論中的用戶名
import { CourseService } from './courseService';

// 自定義錯誤類，支援翻譯鍵值
export class AuthError extends Error {
    public messageKey?: string;
    
    constructor(message: string, messageKey?: string) {
        super(message);
        this.name = 'AuthError';
        this.messageKey = messageKey;
    }
}

export interface AuthUser extends Models.User<Models.Preferences> {}

export const authService = {
    // 檢查是否有本地 session（避免 API 調用）
    hasLocalSession() {
        try {
            // 檢查 Appwrite 會話 cookie（最可靠的方法）
            const cookieString = document.cookie;
            const sessionCookiePattern = /a_session_[a-zA-Z0-9]+=/;
            const hasCookieSession = sessionCookiePattern.test(cookieString);
            
            // 如果有會話 cookie，進一步檢查是否有效（非空值）
            if (hasCookieSession) {
                const sessionCookies = cookieString.match(/a_session_[a-zA-Z0-9]+=([^;]*)/g);
                const hasValidCookie = sessionCookies?.some(cookie => {
                    const value = cookie.split('=')[1];
                    return value && value !== 'null' && value !== 'undefined' && value.length > 0;
                });
                
                if (hasValidCookie) {
                    console.log('檢測到有效的會話 cookie');
                    return true;
                }
            }
            
            console.log('沒有檢測到有效的會話 cookie');
            return false;
        } catch (error) {
            console.error('會話檢測失敗:', error);
            return false;
        }
    },



    // 發送嶺南人驗證碼
    async sendStudentVerificationCode(email: string, language: string = 'zh-TW', theme: 'light' | 'dark' = 'light') {
        try {
            return await studentVerificationService.sendVerificationCode(email, language, theme);
        } catch (error) {
            console.error('發送驗證碼錯誤:', error);
            return {
                success: false,
                message: '發送驗證碼失敗，請稍後再試'
            };
        }
    },

    // 驗證嶺南人驗證碼
    async verifyStudentCode(email: string, code: string): Promise<{ success: boolean; message: string }> {
        try {
            return await studentVerificationService.verifyCode(email, code);
        } catch (error) {
            console.error('驗證驗證碼錯誤:', error);
            return {
                success: false,
                message: '驗證失敗，請稍後再試'
            };
        }
    },

    // 檢查嶺南人郵件是否已驗證
    async isStudentEmailVerified(email: string): Promise<boolean> {
        try {
            return await studentVerificationService.isEmailVerified(email);
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

    // 註冊新用戶（需要先驗證嶺南人郵件）
    async createAccount(email: string, password: string, name: string, recaptchaToken?: string) {
        try {
            // 使用後端 API 創建已驗證的帳戶
            const result = await studentVerificationService.createVerifiedAccount(email, password, name, recaptchaToken);
            
            if (!result.success) {
                throw new Error(result.message);
            }
            
            // 帳戶創建成功後自動登入
            return await this.login(email, password);
            
        } catch (error) {
            throw error;
        }
    },

    // 登入
    async login(email: string, password: string, rememberMe: boolean = false) {
        try {
            console.log('🔄 嘗試登入:', email, '記住我:', rememberMe);
            
            // 檢查是否已有活躍 session
            try {
                const currentUser = await account.get();
                if (currentUser) {
                    console.log('✅ 已有活躍 session，直接返回');
                    return currentUser;
                }
            } catch (error) {
                // 沒有活躍 session，繼續登入流程
                console.log('📝 沒有活躍 session，繼續登入');
            }

            // 創建新的 session
            const session = await account.createEmailPasswordSession(email, password);
            
            // 設置記住我狀態
            if (!rememberMe) {
                localStorage.setItem('rememberMe', 'false');
                sessionStorage.setItem('sessionOnly', 'true');
            } else {
                localStorage.setItem('rememberMe', 'true');
                localStorage.setItem('savedEmail', email);
                sessionStorage.removeItem('sessionOnly');
            }
            
            console.log('✅ 登入成功');
            return session;
            
        } catch (error: any) {
            console.error('❌ 登入錯誤:', error);
            
            // 處理帳戶停用錯誤
            const isAccountDisabled = error?.message && (
                error.message.includes('user is blocked') || 
                error.message.includes('user is disabled') ||
                error.message.includes('account is disabled') ||
                error.message.includes('User account is blocked') ||
                error.message.includes('The current user has been blocked') ||
                error.message.includes('User (role: guests) missing scope')
            );
            
            if (isAccountDisabled) {
                throw new AuthError('Your account has been disabled. Please contact customer service to reactivate.', 'auth.accountDisabled');
            }
            
            // 如果仍然是 session 衝突錯誤，嘗試強制清理所有 sessions
            if (error?.message?.includes('session is active') || error?.message?.includes('session is prohibited')) {
                try {
                    // 嘗試刪除所有 sessions
                    await account.deleteSessions();
                    
                    // 再次嘗試創建 session
                    const session = await account.createEmailPasswordSession(email, password);
                    
                    // 設置記住我狀態
                    if (!rememberMe) {
                        localStorage.setItem('rememberMe', 'false');
                        sessionStorage.setItem('sessionOnly', 'true');
                    } else {
                        localStorage.setItem('rememberMe', 'true');
                        localStorage.setItem('savedEmail', email);
                        sessionStorage.removeItem('sessionOnly');
                    }
                    
                    return session;
                } catch (retryError) {
                    console.error('Failed to clear sessions and retry login:', retryError);
                    throw retryError;
                }
            }
            
            throw error;
        }
    },

    // 發送密碼重設郵件
    async sendPasswordReset(email: string, recaptchaToken?: string, language: string = 'zh-TW', theme: 'light' | 'dark' = 'light'): Promise<{ success: boolean; message: string }> {
        try {
            console.log('🔄 發送密碼重設郵件:', email, '語言:', language, '主題:', theme);
            
            // 調用後端 API 發送密碼重設郵件
            const response = await fetch(`https://sgp.cloud.appwrite.io/v1/functions/send-verification-email/executions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Appwrite-Project': 'lingubible',
                },
                body: JSON.stringify({
                    body: JSON.stringify({
                        action: 'sendPasswordReset',
                        email,
                        recaptchaToken,
                        language,
                        theme
                    }),
                    async: false,
                    method: 'POST'
                }),
            });

            console.log('📡 密碼重設 API 回應狀態:', response.status, response.statusText);

            if (!response.ok) {
                console.error('❌ API 請求失敗:', response.status, response.statusText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📦 密碼重設 API 回應數據:', data);

            // 解析 Appwrite Function 的回應
            let result;
            try {
                result = JSON.parse(data.responseBody || data.response || '{}');
                console.log('📋 解析後的結果:', result);
            } catch (parseError) {
                console.error('❌ 解析回應失敗:', parseError);
                console.log('🔍 原始回應數據:', data);
                result = { success: false, message: '解析回應失敗' };
            }

            return {
                success: result.success || false,
                message: result.message || '發送密碼重設郵件失敗'
            };

        } catch (error: any) {
            console.error('❌ 發送密碼重設郵件錯誤:', error);
            return {
                success: false,
                message: error.message || '發送密碼重設郵件失敗，請稍後再試'
            };
        }
    },

    // 完成密碼重設
    async completePasswordReset(userId: string, secret: string, password: string) {
        try {
            console.log('🔄 完成密碼重設:', { userId: userId.substring(0, 8) + '...' });
            
            // 使用 Appwrite 的密碼重設完成功能
            await account.updateRecovery(userId, secret, password);
            
            console.log('✅ 密碼重設完成');
            return { success: true };
            
        } catch (error: any) {
            console.error('❌ 完成密碼重設錯誤:', error);
            
            // 處理常見的錯誤情況
            if (error?.message?.includes('Invalid credentials') || 
                error?.message?.includes('Invalid recovery') ||
                error?.code === 401) {
                throw new AuthError('Reset link is invalid or expired, please request a new password reset', 'auth.invalidOrExpiredToken');
            }
            
            if (error?.message?.includes('Password must be between 8 and 256 characters')) {
                throw new AuthError('Password must be between 8 and 256 characters', 'auth.passwordLengthError');
            }
            
            if (error?.message?.includes('Too many requests')) {
                throw new AuthError('Too many requests, please try again later', 'auth.tooManyRequests');
            }
            
            throw error;
        }
    },

    // 驗證密碼重設 token
    async validatePasswordResetToken(userId: string, token: string) {
        try {
            console.log('🔍 驗證密碼重設 token:', { userId: userId.substring(0, 8) + '...' });
            
            // 調用後端 API 驗證 token
            const response = await fetch(`https://sgp.cloud.appwrite.io/v1/functions/send-verification-email/executions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Appwrite-Project': 'lingubible',
                },
                body: JSON.stringify({
                    body: JSON.stringify({
                        action: 'validatePasswordResetToken',
                        userId,
                        token
                    }),
                    async: false,
                    method: 'POST'
                }),
            });

            console.log('📡 Token 驗證 API 回應狀態:', response.status, response.statusText);

            if (!response.ok) {
                console.error('❌ API 請求失敗:', response.status, response.statusText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📦 Token 驗證 API 回應數據:', data);

            // 解析 Appwrite Function 的回應
            let result;
            try {
                result = JSON.parse(data.responseBody || data.response || '{}');
                console.log('📋 解析後的結果:', result);
            } catch (parseError) {
                console.error('❌ 解析回應失敗:', parseError);
                console.log('🔍 原始回應數據:', data);
                result = { success: false, message: '解析回應失敗' };
            }

            if (!result.success) {
                throw new Error(result.message || 'Token 驗證失敗');
            }

            console.log('✅ 密碼重設 token 驗證成功');
            return { success: true };
            
        } catch (error: any) {
            console.error('❌ 驗證密碼重設 token 錯誤:', error);
            
            // 處理常見的錯誤情況
            if (error?.message?.includes('Invalid token') || 
                error?.message?.includes('Token expired') ||
                error?.message?.includes('Token not found')) {
                throw new AuthError('Reset link is invalid or expired, please request a new password reset', 'auth.invalidOrExpiredToken');
            }
            
            if (error?.message?.includes('already been used')) {
                throw new AuthError('This reset link has already been used. Please request a new password reset.', 'auth.resetLinkAlreadyUsed');
            }
            
            throw error;
        }
    },

    // 完成自定義密碼重設
    async completeCustomPasswordReset(userId: string, token: string, password: string) {
        try {
            console.log('🔄 完成自定義密碼重設:', { userId: userId.substring(0, 8) + '...' });
            
            // 調用後端 API 完成密碼重設
            const response = await fetch(`https://sgp.cloud.appwrite.io/v1/functions/send-verification-email/executions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Appwrite-Project': 'lingubible',
                },
                body: JSON.stringify({
                    body: JSON.stringify({
                        action: 'completePasswordReset',
                        userId,
                        token,
                        password
                    }),
                    async: false,
                    method: 'POST'
                }),
            });

            console.log('📡 密碼重設完成 API 回應狀態:', response.status, response.statusText);

            if (!response.ok) {
                console.error('❌ API 請求失敗:', response.status, response.statusText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📦 密碼重設完成 API 回應數據:', data);

            // 解析 Appwrite Function 的回應
            let result;
            try {
                result = JSON.parse(data.responseBody || data.response || '{}');
                console.log('📋 解析後的結果:', result);
            } catch (parseError) {
                console.error('❌ 解析回應失敗:', parseError);
                console.log('🔍 原始回應數據:', data);
                result = { success: false, message: '解析回應失敗' };
            }

            if (!result.success) {
                throw new Error(result.message || '密碼重設失敗');
            }

            console.log('✅ 自定義密碼重設完成');
            return { success: true };
            
        } catch (error: any) {
            console.error('❌ 完成自定義密碼重設錯誤:', error);
            
            // 處理常見的錯誤情況
            if (error?.message?.includes('Invalid token') || 
                error?.message?.includes('Token expired') ||
                error?.message?.includes('Token not found')) {
                throw new AuthError('Reset link is invalid or expired, please request a new password reset', 'auth.invalidOrExpiredToken');
            }
            
            if (error?.message?.includes('Password must be between 8 and 256 characters')) {
                throw new AuthError('Password must be between 8 and 256 characters', 'auth.passwordLengthError');
            }
            
            if (error?.message?.includes('Too many requests')) {
                throw new AuthError('Too many requests, please try again later', 'auth.tooManyRequests');
            }
            
            throw error;
        }
    },

    // 獲取當前用戶
    async getCurrentUser() {
        try {
            const user = await account.get();
            console.log('✅ authService.getCurrentUser 成功:', user?.email);
            return user;
        } catch (error: any) {
            // 靜默處理未授權錯誤（401），這是正常的未登入狀態
            if (error?.status === 401 || error?.code === 401 || 
                error?.message?.includes('401') || 
                error?.message?.includes('Unauthorized')) {
                // 完全靜默處理，不記錄401錯誤因為這是正常的未登入狀態
                return null;
            }
            
            // 對於其他錯誤，記錄並拋出，讓上層決定如何處理
            console.warn('⚠️ authService.getCurrentUser 遇到非401錯誤:', error?.message || error);
            throw error; // 拋出錯誤，讓 checkUser 可以進行重試
        }
    },

    // 更新用戶名
    async updateUserName(name: string) {
        try {
            console.log(`🔄 Starting user name update to "${name}"`);
            
            // 首先獲取當前用戶信息
            const currentUser = await account.get();
            console.log(`👤 Current user ID: ${currentUser.$id}, Current name: "${currentUser.name}"`);
            
            // 更新 Appwrite 中的用戶名
            const result = await account.updateName(name);
            console.log(`✅ Appwrite username updated successfully`);
            
            // 同步更新所有評論中的用戶名（僅非匿名評論）
            console.log(`🔄 Starting review username synchronization...`);
            try {
                await CourseService.updateUserReviewsUsername(currentUser.$id, name);
                console.log(`✅ Review username synchronization completed`);
            } catch (error) {
                console.warn('⚠️ Failed to update username in reviews, but user profile update succeeded:', error);
            }
            
            return result;
        } catch (error) {
            console.error('❌ 更新用戶名錯誤:', error);
            throw error;
        }
    },

    // 更新密碼
    async updatePassword(newPassword: string, oldPassword: string) {
        try {
            return await account.updatePassword(newPassword, oldPassword);
        } catch (error: any) {
            console.error('更新密碼錯誤:', error);
            
            // 處理常見的錯誤情況
            if (error?.message?.includes('Invalid credentials') || 
                error?.message?.includes('password is invalid') ||
                error?.code === 401) {
                throw new AuthError('Current password is incorrect', 'auth.currentPasswordIncorrect');
            }
            
            if (error?.message?.includes('Password must be between 8 and 256 characters')) {
                throw new AuthError('New password length must be between 8-256 characters', 'auth.newPasswordLengthError');
            }
            
            if (error?.message?.includes('Too many requests')) {
                throw new AuthError('Too many requests, please try again later', 'auth.tooManyRequests');
            }
            
            throw error;
        }
    },

    // 檢查用戶名是否已被使用
    async checkUsernameAvailability(username: string): Promise<{ available: boolean; message: string; messageKey?: string }> {
        try {
            console.log('🔍 檢查用戶名可用性:', username);
            
            // 調用後端 API 檢查用戶名
            const response = await fetch(`https://sgp.cloud.appwrite.io/v1/functions/send-verification-email/executions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Appwrite-Project': 'lingubible',
                },
                body: JSON.stringify({
                    body: JSON.stringify({
                        action: 'checkUsername',
                        username: username.trim()
                    }),
                    async: false,
                    method: 'POST'
                }),
            });

            console.log('📡 用戶名檢查 API 回應狀態:', response.status, response.statusText);

            if (!response.ok) {
                console.error('❌ API 請求失敗:', response.status, response.statusText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('📦 用戶名檢查 API 回應數據:', data);

            // 解析 Appwrite Function 的回應
            let result;
            try {
                result = JSON.parse(data.responseBody || data.response || '{}');
                console.log('📋 解析後的結果:', result);
            } catch (parseError) {
                console.error('❌ 解析回應失敗:', parseError);
                console.log('🔍 原始回應數據:', data);
                result = { available: false, message: '檢查用戶名時發生錯誤' };
            }

            return {
                available: result.available || false,
                message: result.message || '檢查用戶名時發生錯誤'
            };

        } catch (error: any) {
            console.error('❌ 檢查用戶名錯誤:', error);
            return {
                available: false,
                message: error.message || '檢查用戶名時發生錯誤，請稍後再試'
            };
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