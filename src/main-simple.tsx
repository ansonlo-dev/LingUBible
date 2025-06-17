import React from 'react'
import ReactDOM from 'react-dom/client'

// 簡單的 CSS 樣式
const styles = `
  body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
  }
  .container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    text-align: center;
  }
  .success {
    color: #28a745;
    font-weight: bold;
  }
  .time {
    color: #6c757d;
    font-size: 14px;
  }
`;

function SimpleApp() {
  const [time, setTime] = React.useState(new Date().toLocaleString());
  
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleString());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <style>{styles}</style>
      <div className="container">
        <h1>🎉 LingUBible - React 載入成功！</h1>
        <p className="success">✅ React 應用正常運行</p>
        <p>這是一個簡化版本的 LingUBible，用於測試 React 基本功能。</p>
        <p className="time">當前時間：{time}</p>
        <hr />
        <p>如果您看到這個頁面，表示：</p>
        <ul style={{ textAlign: 'left', display: 'inline-block' }}>
          <li>✅ React 正常載入</li>
          <li>✅ TypeScript 編譯成功</li>
          <li>✅ Vite 構建正常</li>
          <li>✅ 基本狀態管理工作</li>
        </ul>
      </div>
    </>
  );
}

console.log('開始載入 React 應用...');

try {
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  root.render(
    <React.StrictMode>
      <SimpleApp />
    </React.StrictMode>
  );
  console.log('React 應用載入成功！');
} catch (error) {
  console.error('React 應用載入失敗:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; color: red; font-family: Arial;">
      <h1>React 載入錯誤</h1>
      <p>錯誤詳情: ${error}</p>
    </div>
  `;
} 