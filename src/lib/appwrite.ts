import { Client, Account, Databases, ID } from 'appwrite';

// 使用環境變量來管理不同環境的端點
// 現在使用已驗證的自定義域名，這將消除 localStorage 警告
const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://api.lingubible.com/v1';
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || 'lingubible';

const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

// 在開發環境中抑制 localStorage 警告
if (import.meta.env.DEV) {
    // 覆蓋 console.warn 來過濾 Appwrite localStorage 警告
    const originalWarn = console.warn;
    console.warn = (...args) => {
        const message = args.join(' ');
        if (message.includes('localStorage for session management') || 
            message.includes('Increase your security by adding a custom domain')) {
            return; // 忽略這個警告
        }
        originalWarn.apply(console, args);
    };
}

export const account = new Account(client);
export const databases = new Databases(client);

export { ID };
export default client; 