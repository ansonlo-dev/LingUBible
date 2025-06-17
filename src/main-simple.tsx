import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

function SimpleApp() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>LingUBible - 測試頁面</h1>
      <p>如果您看到這個頁面，表示 React 應用正常載入。</p>
      <p>當前時間：{new Date().toLocaleString()}</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SimpleApp />
  </React.StrictMode>
); 