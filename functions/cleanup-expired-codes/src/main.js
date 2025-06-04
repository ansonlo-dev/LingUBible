import { Client, Databases, Query } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  try {
    log('🧹 開始清理過期驗證碼');

    // 檢查是否有必要的環境變數
    if (!process.env.APPWRITE_API_KEY) {
      error('❌ APPWRITE_API_KEY 環境變數未設定');
      return res.json({
        success: false,
        message: 'API Key 未配置，無法執行清理操作'
      }, 500);
    }

    // 初始化 Appwrite 客戶端
    const client = new Client()
      .setEndpoint('https://fra.cloud.appwrite.io/v1')
      .setProject('lingubible')
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    // 獲取當前時間
    const now = new Date();
    log('⏰ 當前時間:', now.toISOString());

    // 查詢所有過期的驗證碼
    log('🔍 查詢過期的驗證碼...');
    const expiredCodes = await databases.listDocuments(
      'verification_system',
      'verification_codes',
      [
        Query.lessThan('expiresAt', now.toISOString()),
        Query.limit(100) // 每次最多清理 100 條記錄
      ]
    );

    log(`📊 找到 ${expiredCodes.documents.length} 條過期記錄`);

    if (expiredCodes.documents.length === 0) {
      log('✅ 沒有過期的驗證碼需要清理');
      return res.json({
        success: true,
        message: '沒有過期的驗證碼需要清理',
        cleaned: 0
      });
    }

    // 刪除過期的驗證碼
    let cleanedCount = 0;
    let errorCount = 0;
    
    for (const doc of expiredCodes.documents) {
      try {
        await databases.deleteDocument(
          'verification_system',
          'verification_codes',
          doc.$id
        );
        cleanedCount++;
        log(`🗑️ 已刪除過期驗證碼: ${doc.email} (過期時間: ${doc.expiresAt})`);
      } catch (deleteError) {
        errorCount++;
        error(`❌ 刪除文檔 ${doc.$id} 失敗:`, deleteError);
      }
    }

    log(`✅ 清理完成，成功刪除 ${cleanedCount} 條記錄，失敗 ${errorCount} 條`);

    return res.json({
      success: true,
      message: `成功清理 ${cleanedCount} 條過期驗證碼${errorCount > 0 ? `，${errorCount} 條刪除失敗` : ''}`,
      cleaned: cleanedCount,
      errors: errorCount,
      total: expiredCodes.documents.length
    });

  } catch (err) {
    error('💥 清理過期驗證碼異常:', err);
    return res.json({
      success: false,
      message: `清理失敗: ${err.message || '請稍後再試'}`,
      cleaned: 0
    }, 500);
  }
}; 