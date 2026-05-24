import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { authService, AuthUser } from '@/services/api/auth';
import { toast } from '@/hooks/use-toast';
import { getAvatarContent } from "@/utils/ui/avatarUtils";
import { avatarService } from "@/services/api/avatar";
import { useLanguage } from '@/hooks/useLanguage';
import AppwriteUserStatsService from '@/services/api/appwriteUserStats';
import { oauthService } from '@/services/api/oauth';

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    register: (email: string, password: string, name: string, recaptchaToken?: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: (forceRefresh?: boolean) => Promise<void>;
    sendStudentVerificationCode: (email: string) => Promise<{ success: boolean; message: string }>;
    verifyStudentCode: (email: string, code: string) => Promise<{ success: boolean; message: string }>;
    isStudentEmailVerified: (email: string) => Promise<boolean>;
    getVerificationRemainingTime: (email: string) => number;
    sendPasswordReset: (email: string, recaptchaToken?: string, language?: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 全局標記防止多個實例同時初始化
let isGloballyInitializing = false;

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

// Hook 必須在 Provider 之前定義以支援 Fast Refresh
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [userSessionId, setUserSessionId] = useState<string | null>(null); // 存儲當前用戶的 sessionId
    const [isCheckingUser, setIsCheckingUser] = useState(false); // 防止重複調用
    const [isRefreshingUser, setIsRefreshingUser] = useState(false); // 防止 refreshUser 重複調用
    const hasInitialized = useRef(false); // 追蹤是否已經初始化
    const { t } = useLanguage(); // 將 useLanguage 移到組件頂層

    useEffect(() => {
        // 只在初始掛載時執行一次，防止重複調用
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            console.log('AuthProvider 初始化，執行 checkUser');
            checkUser();
        }
        
        // 監聽強制用戶更新事件（用於 OAuth 登入後的狀態同步）
        const handleForceUserUpdate = (event: CustomEvent) => {
            const { user: updatedUser } = event.detail;
            if (updatedUser) {
                console.log('🔄 收到強制用戶更新事件:', updatedUser.email);
                setUser(updatedUser);
                console.log('✅ 用戶狀態已強制更新，UI 應該立即反映變化');
            }
        };
        
        window.addEventListener('forceUserUpdate', handleForceUserUpdate as EventListener);
        
        // 設置定期清理非學生用戶的定時器（每5分鐘執行一次）
        const cleanupInterval = setInterval(async () => {
            try {
                // 調用清理函數
                const response = await fetch(`https://sgp.cloud.appwrite.io/v1/functions/cleanup-expired-codes/executions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Appwrite-Project': 'lingubible',
                    },
                    body: JSON.stringify({
                        body: JSON.stringify({
                            action: 'immediate_cleanup',
                            userId: user?.$id,
                            email: user?.email,
                            reason: 'non_student_email_session_cleanup'
                        }),
                        async: false,
                        method: 'POST'
                    }),
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log('定期清理執行成功:', result);
                } else {
                    console.error('定期清理執行失敗:', response.status);
                }
            } catch (error) {
                console.error('定期清理調用失敗:', error);
            }
        }, 5 * 60 * 1000); // 5分鐘

        // 清理定時器和事件監聽器
        return () => {
            clearInterval(cleanupInterval);
            window.removeEventListener('forceUserUpdate', handleForceUserUpdate as EventListener);
        };
    }, []);

    const checkUser = async (): Promise<AuthUser | null> => {
        // 防止重複調用（本地和全局）
        if (isCheckingUser || isGloballyInitializing) {
            console.log('checkUser 已在執行中，跳過重複調用', { isCheckingUser, isGloballyInitializing });
            return null;
        }
        
        setIsCheckingUser(true);
        isGloballyInitializing = true;
        
        try {
            // 清理非學生用戶會話的輔助函數
        const cleanupNonStudentSession = async (email: string) => {
            try {
                await oauthService.forceCleanupNonStudentSession();
                
                // 顯示警告 toast
                toast({
                    variant: "destructive",
                    title: t('security.warning'),
                    description: t('security.nonStudentAccountDetected'),
                    duration: 8000,
                });
            } catch (cleanupError) {
                console.error('清理非學生用戶會話失敗:', cleanupError);
            }
            
            setUser(null);
            setUserSessionId(null);
        };
        
        try {
            // 檢查是否需要刷新會話（來自 OAuth 回調）
            const needSessionRefresh = localStorage.getItem('needSessionRefresh');
            if (needSessionRefresh) {
                console.log('檢測到需要刷新會話的標記，清理標記...');
                localStorage.removeItem('needSessionRefresh');
                
                // 等待一下讓會話完全建立
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // 首先檢查本地會話標記，避免不必要的 API 調用
            const hasLocalSession = authService.hasLocalSession();
            console.log('本地會話檢測結果:', hasLocalSession);
            
            let currentUser = null;
            let hasValidSession = false;
            
            // 只有在有本地會話標記時才嘗試獲取用戶信息，但增加一次直接嘗試以處理 cookie 檢測不準確的情況
            if (hasLocalSession) {
                console.log('🔄 檢測到本地會話，嘗試獲取用戶信息...');
                
                // 嘗試多次獲取用戶信息，處理可能的網路延遲或會話建立問題
                let attempts = 0;
                const maxAttempts = 3;
                
                while (attempts < maxAttempts && !currentUser) {
                    try {
                        currentUser = await authService.getCurrentUser();
                        if (currentUser) {
                            hasValidSession = true;
                            console.log(`✅ 獲取用戶成功 (嘗試 ${attempts + 1}):`, currentUser.email);
                            break;
                        }
                    } catch (directError: any) {
                        attempts++;
                        console.log(`❌ 獲取用戶失敗 (嘗試 ${attempts}):`, directError?.message || directError);
                        
                        // 如果是 401 錯誤，表示會話已過期，不要重試
                        if (directError?.code === 401 || directError?.type === 'general_unauthorized_scope') {
                            console.log('🔒 會話已過期，停止重試');
                            hasValidSession = false;
                            break;
                        }
                        
                        // 如果還有重試機會，等待一下再重試
                        if (attempts < maxAttempts) {
                            console.log(`⏳ 等待 ${attempts * 500}ms 後重試...`);
                            await new Promise(resolve => setTimeout(resolve, attempts * 500));
                        }
                    }
                }
                
                if (!currentUser) {
                    console.log('❌ 所有嘗試都失敗，無法獲取用戶信息');
                    hasValidSession = false;
                }
            } else {
                // 沒有本地會話標記，但嘗試一次 API 調用以防 cookie 檢測不準確
                try {
                    currentUser = await authService.getCurrentUser();
                    if (currentUser) {
                        hasValidSession = true;
                        console.log('✅ 意外獲取到用戶（cookie 檢測可能不準確）:', currentUser.email);
                    }
                } catch (directError: any) {
                    // 靜默處理 401 錯誤，這是正常的未登入狀態
                    if (directError?.code === 401 || directError?.type === 'general_unauthorized_scope') {
                        // 完全靜默，不記錄日誌
                    } else {
                        console.log('❌ 獲取用戶失敗:', directError?.message || directError);
                    }
                    hasValidSession = false;
                }
            }
            
            if (hasValidSession && currentUser) {
                // 只有當我們有用戶信息時才繼續處理

                // 檢查是否為 session-only 模式且是新的瀏覽器 session
                const sessionOnly = sessionStorage.getItem('sessionOnly');
                const rememberMe = localStorage.getItem('rememberMe');
                const googleLinkSuccess = localStorage.getItem('googleLinkSuccess');
                const oauthSession = sessionStorage.getItem('oauthSession');
                
                // 檢查是否在 Google 連結過程中（通過檢查 URL 或最近的連結活動）
                const isInOAuthFlow = window.location.pathname.includes('/oauth/') || 
                                    window.location.pathname === '/settings' && 
                                    (Date.now() - (parseInt(localStorage.getItem('lastOAuthAttempt') || '0'))) < 30000; // 30秒內
                
                // 檢查是否是 OAuth 登入完成的短期標記
                const oauthLoginComplete = sessionStorage.getItem('oauthLoginComplete');
                const isRecentOAuthLogin = oauthLoginComplete && 
                                         (Date.now() - parseInt(oauthLoginComplete)) < 60000; // 1分鐘內
                
                // 如果是 Google 連結成功的情況、OAuth 會話、在 OAuth 流程中或剛完成 OAuth 登入，跳過 rememberMe 檢查
                // 因為 OAuth 流程不應該受到原始登入時的 rememberMe 設置影響
                if (!googleLinkSuccess && !oauthSession && !isInOAuthFlow && !isRecentOAuthLogin) {
                    // 如果之前選擇了不記住我，且現在是新的瀏覽器 session（sessionOnly 不存在）
                    // 這意味著瀏覽器被關閉並重新打開
                    if (rememberMe === 'false' && !sessionOnly) {
                        console.log('檢測到不記住我的會話且瀏覽器重新打開，執行登出');
                        // 清理 session 並登出
                        await authService.logout();
                        localStorage.removeItem('rememberMe');
                        localStorage.removeItem('savedEmail');
                        setUser(null);
                        setUserSessionId(null);
                        return null;
                    }
                } else {
                    console.log('跳過 rememberMe 檢查，原因:', {
                        googleLinkSuccess: !!googleLinkSuccess,
                        oauthSession: !!oauthSession,
                        isInOAuthFlow,
                        isRecentOAuthLogin,
                        rememberMe
                    });
                }
                
                // 🚨 ENHANCED SECURITY: 驗證主帳戶郵箱是否為學生郵箱
                console.log('🔍 檢查用戶郵箱:', currentUser.email, '是否為學生郵箱:', oauthService.isStudentEmail(currentUser.email));
                
                // 🛡️ CRITICAL: Re-enable strict student email validation for OAuth security
                console.log('🛡️ 啟用嚴格的學生郵箱檢查，防止 OAuth 安全漏洞');
                
                if (currentUser && !oauthService.isStudentEmail(currentUser.email)) {
                    console.error('🚨 SECURITY: 檢測到非學生主帳戶郵箱:', currentUser.email);
                    
                    // OAuth accounts should be immediately blocked if they bypass validation
                    const oauthAttemptActive = sessionStorage.getItem('oauthAttemptActive');
                    if (oauthAttemptActive === 'true') {
                        console.error('🚨 CRITICAL: Non-student OAuth account detected in AuthContext!');
                        
                        // Force cleanup immediately
                        await cleanupNonStudentSession(currentUser.email);
                        return null;
                    }
                    
                    // 檢查是否有 Google 身份提供者連結
                    try {
                        const isGoogleLinked = await oauthService.isGoogleLinked();
                        
                        if (isGoogleLinked) {
                            // 用戶有 Google 連結，檢查 Google 郵箱是否為學生郵箱
                            const googleAccountInfo = await oauthService.getGoogleAccountInfo();
                            const googleEmail = googleAccountInfo?.providerEmail;
                            
                            if (googleEmail && oauthService.isStudentEmail(googleEmail)) {
                                // Google 郵箱是學生郵箱，允許繼續
                                console.log('用戶通過學生 Google 郵箱驗證:', googleEmail);
                            } else {
                                // 主帳戶和 Google 郵箱都不是學生郵箱，清理會話
                                console.warn('主帳戶和 Google 郵箱都不是學生郵箱，清理會話');
                                await cleanupNonStudentSession(currentUser.email);
                                return null;
                            }
                        } else {
                            // 沒有 Google 連結且主帳戶不是學生郵箱，清理會話
                            console.warn('主帳戶不是學生郵箱且沒有 Google 連結，清理會話');
                            await cleanupNonStudentSession(currentUser.email);
                            return null;
                        }
                    } catch (identityError) {
                        console.error('檢查身份提供者失敗:', identityError);
                        // 如果無法檢查身份提供者，為安全起見清理會話
                        await cleanupNonStudentSession(currentUser.email);
                        return null;
                    }
                }
                
                console.log('✅ 所有檢查通過，設置用戶狀態:', currentUser.email);
                setUser(currentUser);
                console.log('🎯 setUser 已調用，用戶:', currentUser.email);
                
                // 如果是剛剛完成 Google 連結的用戶，顯示歡迎消息
                if (googleLinkSuccess && currentUser) {
                    localStorage.removeItem('googleLinkSuccess');
                    
                    // 延遲清理 OAuth 會話標記，給系統時間穩定會話狀態
                    // 延長時間到 10 秒，確保所有相關的頁面重新渲染都完成
                    setTimeout(() => {
                        sessionStorage.removeItem('oauthSession');
                        console.log('OAuth 會話標記已清理，恢復正常會話管理');
                    }, 10000); // 10秒後清理
                    
                    const username = getUserDisplayName(currentUser, t);
                    toast({
                        variant: "success",
                        title: `🎉 ${t('oauth.linkSuccess')}`,
                        description: t('toast.welcomeBack', { username }),
                        duration: 4000,
                    });
                }
                
                // 返回用戶信息給調用者
                return currentUser;
            } else {
                console.log('❌ checkUser: 沒有有效會話或用戶，設置為 null');
                setUser(null);
                setUserSessionId(null);
                return null;
            }
        } catch (error) {
            console.error('檢查用戶狀態失敗:', error);
            setUser(null);
            setUserSessionId(null);
            return null;
        } finally {
            setLoading(false);
        }
        } catch (outerError) {
            console.error('checkUser 執行失敗:', outerError);
            setUser(null);
            setUserSessionId(null);
            setLoading(false);
            return null;
        } finally {
            setIsCheckingUser(false);
            isGloballyInitializing = false;
        }
    };

    const login = async (email: string, password: string, rememberMe?: boolean) => {
        try {
            console.log('🔐 開始登入流程:', email);
            await authService.login(email, password, rememberMe);
            console.log('✅ authService.login 完成');
            
            const currentUser = await checkUser();
            console.log('✅ checkUser 完成，返回用戶:', currentUser?.email);
            
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
            console.log('🎉 準備顯示登入成功 toast，用戶:', currentUser?.email);
            const username = getUserDisplayName(currentUser, t);
            console.log('👤 用戶顯示名稱:', username);
            
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
            const currentUser = await checkUser();
            
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
        // 獲取當前主題，如果無法獲取則使用默認值
        const currentTheme = 'light'; // 暫時使用默認值
        const { language } = useLanguage();
        return await authService.sendStudentVerificationCode(email, language, currentTheme);
    };

    const verifyStudentCode = async (email: string, code: string) => {
        return await authService.verifyStudentCode(email, code);
    };

    const sendPasswordReset = async (email: string, recaptchaToken?: string, language?: string) => {
        // 獲取當前主題，如果無法獲取則使用默認值
        const currentTheme = 'light'; // 暫時使用默認值
        return await authService.sendPasswordReset(email, recaptchaToken, language, currentTheme);
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

    const refreshUser = async (forceRefresh: boolean = false) => {
        // 防止重複調用
        if (isRefreshingUser) {
            console.log('refreshUser 已在執行中，跳過重複調用');
            return;
        }
        
        setIsRefreshingUser(true);
        
        try {
            // 保存當前用戶狀態作為備份
            const currentUserBackup = user;
            
            // 檢查是否為強制刷新（用於 OAuth 登入）或有本地會話
            const hasLocalSession = authService.hasLocalSession();
            if (!forceRefresh && !hasLocalSession) {
                console.log('沒有本地會話且非強制刷新，跳過刷新');
                // 只有在確實沒有會話時才清空用戶狀態
                if (!currentUserBackup) {
                    setUser(null);
                    setUserSessionId(null);
                }
                return;
            }
            
            if (forceRefresh) {
                console.log('🔄 執行強制刷新（OAuth 登入模式）');
            }
            
            // 對於 OAuth 流程，可能需要多次嘗試才能獲取到用戶信息
            let currentUser = null;
            let attempts = 0;
            const maxAttempts = 3;
            
            while (!currentUser && attempts < maxAttempts) {
                try {
                    currentUser = await authService.getCurrentUser();
                    if (currentUser) {
                        console.log(`刷新用戶資料成功 (嘗試 ${attempts + 1}):`, currentUser.email);
                        break;
                    }
                } catch (error: any) {
                    // 如果是 401 錯誤，檢查是否真的是會話過期
                    if (error?.code === 401 || error?.type === 'general_unauthorized_scope') {
                        console.log('刷新用戶資料失敗: 會話已過期');
                        // 如果有本地會話但 API 返回 401，可能是暫時的網路問題
                        if (hasLocalSession && attempts < maxAttempts - 1) {
                            console.log('檢測到本地會話存在，可能是暫時的網路問題，繼續重試');
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            attempts++;
                            continue;
                        }
                        break;
                    }
                    
                    console.log(`刷新用戶資料失敗 (嘗試 ${attempts + 1}):`, error);
                    if (attempts < maxAttempts - 1) {
                        // 等待一下再重試
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
                attempts++;
            }
            
            if (currentUser) {
                setUser(currentUser);
                console.log('用戶狀態已更新:', currentUser.email);
            } else {
                console.error('多次嘗試後仍無法獲取用戶信息');
                // 只有在確實沒有本地會話的情況下才清空用戶狀態
                if (!hasLocalSession) {
                    console.log('沒有本地會話，清空用戶狀態');
                    setUser(null);
                    setUserSessionId(null);
                } else {
                    console.log('檢測到本地會話存在，保持當前用戶狀態');
                    // 保持當前用戶狀態，避免意外登出
                }
            }
        } catch (error) {
            console.error('刷新用戶資料失敗:', error);
            // 檢查是否有本地會話，如果有則不清空用戶狀態
            const hasLocalSession = authService.hasLocalSession();
            if (!hasLocalSession) {
                console.log('沒有本地會話，清空用戶狀態');
                setUser(null);
                setUserSessionId(null);
            } else {
                console.log('檢測到本地會話存在，保持當前用戶狀態以避免意外登出');
            }
        } finally {
            setIsRefreshingUser(false);
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