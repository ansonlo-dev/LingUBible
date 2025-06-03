import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, AuthUser } from '../services/auth';
import { toast } from '@/components/ui/use-toast';

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    sendStudentVerificationCode: (email: string) => Promise<{ success: boolean; message: string }>;
    verifyStudentCode: (email: string, code: string) => { success: boolean; message: string };
    isStudentEmailVerified: (email: string) => boolean;
    getVerificationRemainingTime: (email: string) => number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

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
            const username = currentUser?.name || currentUser?.email?.split('@')[0] || '用戶';
            
            toast({
                variant: "success",
                title: "🎉 登入成功！",
                description: `歡迎回來，${username}！`,
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
            
            // 顯示註冊成功 toast
            const username = name || email?.split('@')[0] || '用戶';
            
            toast({
                variant: "success",
                title: "🎊 註冊成功！",
                description: `歡迎加入 LingUBible，${username}！`,
                duration: 4000,
            });
        } catch (error) {
            throw error;
        }
    };

    const sendStudentVerificationCode = async (email: string) => {
        return await authService.sendStudentVerificationCode(email);
    };

    const verifyStudentCode = (email: string, code: string) => {
        return authService.verifyStudentCode(email, code);
    };

    const isStudentEmailVerified = (email: string) => {
        return authService.isStudentEmailVerified(email);
    };

    const getVerificationRemainingTime = (email: string) => {
        return authService.getVerificationRemainingTime(email);
    };

    const logout = async () => {
        try {
            const currentUser = user;
            await authService.logout();
            setUser(null);
            
            // 顯示登出成功 toast
            const username = currentUser?.name || currentUser?.email?.split('@')[0] || '用戶';
            
            toast({
                variant: "success",
                title: "👋 登出成功",
                description: `再見，${username}！期待您的下次造訪。`,
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