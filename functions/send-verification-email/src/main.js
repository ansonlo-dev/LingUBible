import { Client, Databases, Users } from 'node-appwrite';
import { handleRoute } from './routes.js';

export default async ({ req, res, log, error }) => {
  try {
    log('🚀 Function 開始執行');
    log('📝 請求方法:', req.method);
    log('📦 請求體內容:', req.body);

    // 檢查請求方法
    if (req.method !== 'POST') {
      log('❌ 請求方法錯誤:', req.method);
      return res.json({ 
        success: false, 
        message: 'Only POST requests are allowed',
        messageKey: 'error.methodNotAllowed'
      }, 405);
    }

    // 解析請求體
    let requestData;
    try {
      if (!req.body || req.body.trim() === '') {
        log('❌ 請求體為空');
        return res.json({
          success: false,
          message: 'Request data is empty',
          messageKey: 'error.emptyRequest'
        }, 400);
      }

      requestData = JSON.parse(req.body);
      log('📧 解析成功:', requestData);
      
    } catch (parseError) {
      error('❌ JSON 解析失敗:', parseError);
      return res.json({
        success: false,
        message: 'Invalid request data format',
        messageKey: 'error.invalidFormat'
      }, 400);
    }

    // 初始化 Appwrite 客戶端
    const client = new Client()
      .setEndpoint('https://fra.cloud.appwrite.io/v1')
      .setProject('lingubible')
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const users = new Users(client);

    // 準備上下文對象
    const context = {
      client,
      databases,
      users,
      log,
      error,
      res
    };

    // 根據 action 參數決定執行哪個處理器
    const { action = 'send' } = requestData;
    
    log('🎯 Action 參數:', action);
    log('📧 解析參數:', { 
      action, 
      email: requestData.email, 
      code: requestData.code ? requestData.code.substring(0, 2) + '****' : 'undefined', 
      password: requestData.password ? '***' : 'undefined', 
      name: requestData.name, 
      username: requestData.username, 
      message: requestData.message, 
      language: requestData.language, 
      theme: requestData.theme 
    });

    // 使用路由處理器處理請求
    return await handleRoute(action, requestData, context);

  } catch (err) {
    error('💥 Function 執行異常:', err);
    return res.json({
      success: false,
      message: `Service error: ${err.message || 'Please try again later'}`,
      messageKey: 'error.serviceError'
    }, 500);
  }
}; 