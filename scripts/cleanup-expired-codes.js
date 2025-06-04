#!/usr/bin/env node

// 清理過期驗證碼的腳本
// 可以通過 cron job 定期執行

import { Client, Databases, Query } from 'node-appwrite';

async function cleanupExpiredCodes() {
  try {
    console.log('🧹 開始清理過期驗證碼');

    // 初始化 Appwrite 客戶端
    const client = new Client()
      .setEndpoint('https://fra.cloud.appwrite.io/v1')
      .setProject('lingubible')
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    // 查詢所有過期的驗證碼
    const now = new Date().toISOString();
    console.log('🔍 查詢過期驗證碼，當前時間:', now);

    const expiredCodes = await databases.listDocuments(
      'verification_system',
      'verification_codes',
      [
        Query.lessThan('expiresAt', now),
        Query.limit(100) // 每次最多清理 100 條記錄
      ]
    );

    console.log(`📊 找到 ${expiredCodes.documents.length} 條過期記錄`);

    if (expiredCodes.documents.length === 0) {
      console.log('✅ 沒有過期記錄需要清理');
      return;
    }

    // 批量刪除過期記錄
    let cleanedCount = 0;
    const errors = [];

    for (const doc of expiredCodes.documents) {
      try {
        await databases.deleteDocument(
          'verification_system',
          'verification_codes',
          doc.$id
        );
        cleanedCount++;
        console.log(`🗑️ 已刪除過期記錄: ${doc.email} (過期時間: ${doc.expiresAt})`);
      } catch (deleteError) {
        console.error(`❌ 刪除記錄失敗: ${doc.$id}`, deleteError);
        errors.push({
          documentId: doc.$id,
          email: doc.email,
          error: deleteError.message
        });
      }
    }

    console.log(`✅ 清理完成，共清理 ${cleanedCount} 條記錄`);
    
    if (errors.length > 0) {
      console.log(`⚠️ 有 ${errors.length} 條記錄清理失敗:`, errors);
    }

  } catch (err) {
    console.error('💥 清理過程中發生異常:', err);
    process.exit(1);
  }
}

// 如果直接執行此腳本
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupExpiredCodes()
    .then(() => {
      console.log('🎉 清理任務完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 清理任務失敗:', error);
      process.exit(1);
    });
} 