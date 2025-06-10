import { account, ID } from '@/lib/appwrite';
import { Models } from 'appwrite';
import { studentVerificationService } from '@/services/external/studentVerification';
import { DEV_MODE } from '@/config/devMode';

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

    // 發送嶺南人驗證碼
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
            // 先嘗試清理任何現有的 session，以支持多設備登入
            try {
                const currentUser = await account.get();
                if (currentUser) {
                    // 如果有現有用戶，先登出
                    await account.deleteSession('current');
                }
            } catch (error) {
                // 如果沒有現有 session 或已經過期，忽略錯誤
                console.log('No existing session to clear');
            }

            // 創建新的 session
            let session;
            try {
                session = await account.createEmailPasswordSession(email, password);
            } catch (loginError: any) {
                // 在開發模式下，如果是密碼相關錯誤，嘗試使用預設密碼
                if (DEV_MODE.enabled && loginError?.message && (
                    loginError.message.includes('Invalid credentials') ||
                    loginError.message.includes('Invalid `password` param') ||
                    loginError.message.includes('Password must be between 8 and 256 characters') ||
                    loginError.message.includes('password') ||
                    loginError.code === 400
                )) {
                    console.log('🔧 開發模式：原密碼登入失敗，嘗試使用預設密碼');
                    console.log('🔍 原始錯誤:', loginError.message);
                    try {
                        session = await account.createEmailPasswordSession(email, 'DevMode123!@#');
                        console.log('✅ 開發模式：預設密碼登入成功');
                    } catch (devPasswordError) {
                        console.log('❌ 開發模式：預設密碼登入也失敗');
                        throw loginError; // 拋出原始錯誤
                    }
                } else {
                    throw loginError;
                }
            }
            
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
        } catch (error: any) {
            console.log('🔍 登入錯誤詳情:', {
                message: error?.message,
                code: error?.code,
                type: error?.type,
                status: error?.status
            });
            
            // 檢查是否是帳戶被禁用的錯誤
            const isAccountDisabled = error?.message && (
                error.message.includes('user is blocked') || 
                error.message.includes('user is disabled') ||
                error.message.includes('account is disabled') ||
                error.message.includes('User account is blocked') ||
                error.message.includes('The current user has been blocked') ||
                error.message.includes('User (role: guests) missing scope')
            );
            
            if (isAccountDisabled) {
                throw new Error('您的帳戶已被停用。如需重新啟用，請聯繫客服。');
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
    async sendPasswordReset(email: string, recaptchaToken?: string): Promise<{ success: boolean; message: string }> {
        try {
            console.log('🔄 發送密碼重設郵件:', email);
            
            // 調用後端 API 發送密碼重設郵件
            const response = await fetch(`https://fra.cloud.appwrite.io/v1/functions/send-verification-email/executions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Appwrite-Project': 'lingubible',
                },
                body: JSON.stringify({
                    body: JSON.stringify({
                        action: 'sendPasswordReset',
                        email,
                        recaptchaToken
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
                throw new Error('重設連結無效或已過期，請重新申請密碼重設');
            }
            
            if (error?.message?.includes('Password must be between 8 and 256 characters')) {
                throw new Error('密碼長度必須在8-256字符之間');
            }
            
            if (error?.message?.includes('Too many requests')) {
                throw new Error('請求過於頻繁，請稍後再試');
            }
            
            throw error;
        }
    },

    // 完成自定義密碼重設
    async completeCustomPasswordReset(userId: string, token: string, password: string) {
        try {
            console.log('🔄 完成自定義密碼重設:', { userId: userId.substring(0, 8) + '...' });
            
            // 調用後端 API 完成密碼重設
            const response = await fetch(`https://fra.cloud.appwrite.io/v1/functions/send-verification-email/executions`, {
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
                throw new Error('重設連結無效或已過期，請重新申請密碼重設');
            }
            
            if (error?.message?.includes('Password must be between 8 and 256 characters')) {
                throw new Error('密碼長度必須在8-256字符之間');
            }
            
            if (error?.message?.includes('Too many requests')) {
                throw new Error('請求過於頻繁，請稍後再試');
            }
            
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

    // 更新用戶名
    async updateUserName(name: string) {
        try {
            return await account.updateName(name);
        } catch (error) {
            console.error('更新用戶名錯誤:', error);
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
                throw new Error('目前密碼不正確');
            }
            
            if (error?.message?.includes('Password must be between 8 and 256 characters')) {
                throw new Error('新密碼長度必須在8-256字符之間');
            }
            
            if (error?.message?.includes('Too many requests')) {
                throw new Error('請求過於頻繁，請稍後再試');
            }
            
            throw error;
        }
    },

    // 檢查用戶名是否已被使用
    async checkUsernameAvailability(username: string): Promise<{ available: boolean; message: string; messageKey?: string }> {
        try {
            console.log('🔍 檢查用戶名可用性:', username);
            
            // 調用後端 API 檢查用戶名
            const response = await fetch(`https://fra.cloud.appwrite.io/v1/functions/send-verification-email/executions`, {
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