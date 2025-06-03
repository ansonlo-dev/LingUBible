import { render } from '@react-email/render';
import { VerificationEmail } from '../emails/VerificationEmail';
import React from 'react';

// 在瀏覽器控制台中測試郵件渲染
export const testEmailRender = async () => {
  try {
    const html = await render(React.createElement(VerificationEmail, {
      verificationCode: '123456',
      userEmail: 'test@ln.edu.hk'
    }));
    
    console.log('✅ 郵件模板渲染成功');
    console.log('Generated HTML:', html);
    
    // 創建一個新視窗來預覽郵件
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(html);
      newWindow.document.close();
    }
    
    return html;
  } catch (error) {
    console.error('❌ 郵件模板渲染失敗:', error);
    throw error;
  }
};

// 測試不同的驗證碼
export const testDifferentCodes = async () => {
  const testCases = [
    { code: '123456', email: 'student@ln.edu.hk' },
    { code: '789012', email: 'test@ln.hk' },
    { code: '345678', email: 'user@ln.edu.hk' }
  ];

  for (const testCase of testCases) {
    console.log(`測試驗證碼: ${testCase.code}, 郵件: ${testCase.email}`);
    
    try {
      const html = await render(React.createElement(VerificationEmail, {
        verificationCode: testCase.code,
        userEmail: testCase.email
      }));
      
      console.log(`✅ 測試成功: ${testCase.code}`);
    } catch (error) {
      console.error(`❌ 測試失敗: ${testCase.code}`, error);
    }
  }
};

// 在開發環境中可以在控制台執行：
// import { testEmailRender, testDifferentCodes } from './src/test/emailPreview';
// testEmailRender();
// testDifferentCodes(); 