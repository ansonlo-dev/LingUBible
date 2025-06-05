import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, AuthUser } from '../services/auth';
import { toast } from '@/components/ui/use-toast';
import { getAvatarContent } from '@/utils/avatarUtils';
import { avatarService } from '@/services/avatarService';
import { useLanguage } from '@/contexts/LanguageContext';

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    sendStudentVerificationCode: (email: string) => Promise<{ success: boolean; message: string }>;
    verifyStudentCode: (email: string, code: string) => Promise<{ success: boolean; message: string }>;
    isStudentEmailVerified: (email: string) => Promise<boolean>;
    getVerificationRemainingTime: (email: string) => number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 獲取用戶顯示名稱的輔助函數
const getUserDisplayName = (user: AuthUser | null): string => {
    if (!user) return '用戶';
    
    // 如果 name 存在且不等於 email，則使用 name（用戶名）
    if (user.name && user.name !== user.email) {
        return user.name;
    }
    
    // 否則使用郵箱前綴
    return user.email?.split('@')[0] || '用戶';
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

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
                    return;
                }
                
                const currentUser = await authService.getCurrentUser();
                setUser(currentUser);
            } else {
                setUser(null);
            }
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email: string, password: string, rememberMe?: boolean) => {
        try {
            await authService.login(email, password, rememberMe);
            await checkUser();
            
            // 顯示登入成功 toast
            const currentUser = await authService.getCurrentUser();
            const username = getUserDisplayName(currentUser);
            
            // 獲取用戶頭像
            let userAvatar = '';
            if (currentUser?.$id) {
                try {
                    // 嘗試獲取自定義頭像
                    const customAvatar = await avatarService.getUserAvatar(currentUser.$id);
                    
                    // 獲取頭像內容
                    const avatarContent = getAvatarContent(
                        {
                            showPersonalAvatar: true,
                            showAnonymousAvatar: false,
                            size: 'md',
                            context: 'profile'
                        },
                        {
                            userId: currentUser.$id,
                            name: currentUser.name,
                            email: currentUser.email,
                            customAvatar: customAvatar || undefined
                        }
                    );
                    
                    if (avatarContent.type === 'emoji') {
                        userAvatar = avatarContent.content + ' ';
                    }
                } catch (error) {
                    console.error('獲取用戶頭像失敗:', error);
                }
            }
            
            toast({
                variant: "success",
                title: `${userAvatar}🎉 ${t('toast.loginSuccess')}`,
                description: t('toast.welcomeBack', { username }),
                duration: 4000,
            });
        } catch (error) {
            throw error;
        }
    };

    const register = async (email: string, password: string, name: string) => {
        try {
            await authService.createAccount(email, password, name);
            await checkUser();
            
            // 顯示註冊成功 toast，使用傳入的用戶名
            const username = name || email?.split('@')[0] || '用戶';
            
            // 獲取用戶頭像
            let userAvatar = '';
            const currentUser = await authService.getCurrentUser();
            if (currentUser?.$id) {
                try {
                    // 嘗試獲取自定義頭像
                    const customAvatar = await avatarService.getUserAvatar(currentUser.$id);
                    
                    // 獲取頭像內容
                    const avatarContent = getAvatarContent(
                        {
                            showPersonalAvatar: true,
                            showAnonymousAvatar: false,
                            size: 'md',
                            context: 'profile'
                        },
                        {
                            userId: currentUser.$id,
                            name: currentUser.name,
                            email: currentUser.email,
                            customAvatar: customAvatar || undefined
                        }
                    );
                    
                    if (avatarContent.type === 'emoji') {
                        userAvatar = avatarContent.content + ' ';
                    }
                } catch (error) {
                    console.error('獲取用戶頭像失敗:', error);
                }
            }
            
            toast({
                variant: "success",
                title: `${userAvatar}🎊 ${t('toast.registerSuccess')}`,
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

    const isStudentEmailVerified = async (email: string) => {
        return authService.isStudentEmailVerified(email);
    };

    const getVerificationRemainingTime = (email: string) => {
        return authService.getVerificationRemainingTime(email);
    };

    const logout = async () => {
        try {
            const currentUser = user;
            
            // 獲取用戶頭像（在登出前）
            let userAvatar = '';
            if (currentUser?.$id) {
                try {
                    // 嘗試獲取自定義頭像
                    const customAvatar = await avatarService.getUserAvatar(currentUser.$id);
                    
                    // 獲取頭像內容
                    const avatarContent = getAvatarContent(
                        {
                            showPersonalAvatar: true,
                            showAnonymousAvatar: false,
                            size: 'md',
                            context: 'profile'
                        },
                        {
                            userId: currentUser.$id,
                            name: currentUser.name,
                            email: currentUser.email,
                            customAvatar: customAvatar || undefined
                        }
                    );
                    
                    if (avatarContent.type === 'emoji') {
                        userAvatar = avatarContent.content + ' ';
                    }
                } catch (error) {
                    console.error('獲取用戶頭像失敗:', error);
                }
            }
            
            await authService.logout();
            setUser(null);
            
            // 顯示登出成功 toast
            const username = getUserDisplayName(currentUser);
            
            toast({
                variant: "success",
                title: `${userAvatar}👋 ${t('toast.logoutSuccess')}`,
                description: t('toast.goodbye', { username }),
                duration: 4000,
            });
        } catch (error) {
            throw error;
        }
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        sendStudentVerificationCode,
        verifyStudentCode,
        isStudentEmailVerified,
        getVerificationRemainingTime,
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