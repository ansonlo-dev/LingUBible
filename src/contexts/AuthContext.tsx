import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, AuthUser } from '@/services/api/auth';
import { toast } from '@/components/ui/use-toast';
import { getAvatarContent } from "@/utils/ui/avatarUtils";
import { avatarService } from "@/services/api/avatar";
import { useLanguage } from '@/contexts/LanguageContext';
import AppwriteUserStatsService from '@/services/api/appwriteUserStats';

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    register: (email: string, password: string, name: string, recaptchaToken?: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    sendStudentVerificationCode: (email: string) => Promise<{ success: boolean; message: string }>;
    verifyStudentCode: (email: string, code: string) => Promise<{ success: boolean; message: string }>;
    isStudentEmailVerified: (email: string) => Promise<boolean>;
    getVerificationRemainingTime: (email: string) => number;
    sendPasswordReset: (email: string, recaptchaToken?: string, language?: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 獲取用戶顯示名稱的輔助函數
const getUserDisplayName = (user: AuthUser | null, t: (key: string) => string): string => {
    if (!user) return t('common.user');
    
    // 如果 name 存在且不等於 email，則使用 name（用戶名）
    if (user.name && user.name !== user.email) {
        return user.name;
    }
    
    // 否則使用郵箱前綴
    return user.email?.split('@')[0] || t('common.user');
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [userSessionId, setUserSessionId] = useState<string | null>(null); // 存儲當前用戶的 sessionId
    const { t } = useLanguage(); // 將 useLanguage 移到組件頂層

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            if (authService.hasLocalSession()) {
                // 檢查是否為 session-only 模式且是新的瀏覽器 session
                const sessionOnly = sessionStorage.getItem('sessionOnly');
                const rememberMe = localStorage.getItem('rememberMe');
                
                // 如果之前選擇了不記住我，且現在是新的瀏覽器 session（sessionOnly 不存在）
                // 這意味著瀏覽器被關閉並重新打開
                if (rememberMe === 'false' && !sessionOnly) {
                    // 清理 session 並登出
                    await authService.logout();
                    localStorage.removeItem('rememberMe');
                    localStorage.removeItem('savedEmail');
                    setUser(null);
                    setUserSessionId(null);
                    return;
                }
                
                const currentUser = await authService.getCurrentUser();
                setUser(currentUser);
            } else {
                setUser(null);
                setUserSessionId(null);
            }
        } catch (error) {
            setUser(null);
            setUserSessionId(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string, rememberMe?: boolean) => {
        try {
            await authService.login(email, password, rememberMe);
            await checkUser();
            
            // 獲取當前用戶（已經在 checkUser 中獲取過了）
            const currentUser = user || await authService.getCurrentUser();
            
            // 異步處理統計記錄和頭像獲取，不阻塞登入流程
            if (currentUser?.$id) {
                // 統計記錄 - 異步執行，不等待結果
                const userStatsService = AppwriteUserStatsService.getInstance();
                userStatsService.userLogin(currentUser.$id).then((sessionId) => {
                    console.log('用戶統計: 登入記錄成功，會話 ID:', sessionId);
                    // 存儲 sessionId
                    setUserSessionId(sessionId);
                    // 觸發統計數據更新事件，讓 UI 立即刷新
                    window.dispatchEvent(new CustomEvent('userStatsUpdated'));
                }).catch((error) => {
                    console.error('用戶統計: 登入記錄失敗', error);
                });
                
                // 頭像獲取 - 異步執行，不等待結果
                avatarService.getUserAvatar(currentUser.$id).then((customAvatar) => {
                    // 頭像獲取成功，但不需要立即顯示
                    console.log('用戶頭像已預載');
                }).catch((error) => {
                    console.error('預載用戶頭像失敗:', error);
                });
            }
            
            // 立即顯示簡化的登入成功 toast
            const username = getUserDisplayName(currentUser, t);
            
            toast({
                variant: "success",
                title: `🎉 ${t('toast.loginSuccess')}`,
                description: t('toast.welcomeBack', { username }),
                duration: 4000,
            });
        } catch (error) {
            throw error;
        }
    };

    const register = async (email: string, password: string, name: string, recaptchaToken?: string) => {
        try {
            await authService.createAccount(email, password, name, recaptchaToken);
            await checkUser();
            
            // 獲取當前用戶
            const currentUser = user || await authService.getCurrentUser();
            
            // 異步處理統計記錄，不阻塞註冊流程
            if (currentUser?.$id) {
                const userStatsService = AppwriteUserStatsService.getInstance();
                userStatsService.userLogin(currentUser.$id).then((sessionId) => {
                    console.log('用戶統計: 註冊記錄成功，會話 ID:', sessionId);
                    // 存儲 sessionId
                    setUserSessionId(sessionId);
                    // 觸發統計數據更新事件，讓 UI 立即刷新
                    window.dispatchEvent(new CustomEvent('userStatsUpdated'));
                }).catch((error) => {
                    console.error('用戶統計: 註冊記錄失敗', error);
                });
            }
            
            // 立即顯示註冊成功 toast，使用傳入的用戶名
            const username = name || email?.split('@')[0] || t('common.user');
            
            toast({
                variant: "success",
                title: `🎊 ${t('toast.registerSuccess')}`,
                description: t('toast.welcomeToApp', { username }),
                duration: 4000,
            });
        } catch (error) {
            throw error;
        }
    };

    const sendStudentVerificationCode = async (email: string) => {
        return await authService.sendStudentVerificationCode(email);
    };

    const verifyStudentCode = async (email: string, code: string) => {
        return await authService.verifyStudentCode(email, code);
    };

      const sendPasswordReset = async (email: string, recaptchaToken?: string, language?: string) => {
    return await authService.sendPasswordReset(email, recaptchaToken, language);
  };

    const isStudentEmailVerified = async (email: string) => {
        return authService.isStudentEmailVerified(email);
    };

    const getVerificationRemainingTime = (email: string) => {
        return authService.getVerificationRemainingTime(email);
    };

    const logout = async () => {
        try {
            const currentUser = user;
            const username = getUserDisplayName(currentUser, t);
            
            // 處理統計記錄，確保立即更新
            if (currentUser?.$id && userSessionId) {
                const userStatsService = AppwriteUserStatsService.getInstance();
                try {
                    // 等待登出操作完成
                    await userStatsService.userLogout(userSessionId);
                    console.log('用戶統計: 登出記錄成功');
                    
                    // 立即觸發統計數據更新事件
                    window.dispatchEvent(new CustomEvent('userStatsUpdated'));
                    
                    // 額外的延遲觸發，確保數據庫同步完成
                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('userStatsUpdated'));
                        console.log('用戶統計: 延遲更新觸發');
                    }, 500);
                    
                } catch (error) {
                    console.error('用戶統計: 登出記錄失敗', error);
                    // 即使失敗也觸發更新，讓系統自我修正
                    window.dispatchEvent(new CustomEvent('userStatsUpdated'));
                }
            }
            
            await authService.logout();
            setUser(null);
            setUserSessionId(null); // 清除 sessionId
            
            // 立即顯示登出成功 toast
            toast({
                variant: "success",
                title: `👋 ${t('toast.logoutSuccess')}`,
                description: t('toast.goodbye', { username }),
                duration: 4000,
            });
        } catch (error) {
            throw error;
        }
    };

    const refreshUser = async () => {
        try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
        } catch (error) {
            console.error('刷新用戶資料失敗:', error);
            // 如果刷新失敗，可能是 session 過期，設置為 null
            setUser(null);
            setUserSessionId(null);
        }
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        sendStudentVerificationCode,
        verifyStudentCode,
        isStudentEmailVerified,
        getVerificationRemainingTime,
        sendPasswordReset,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
} 