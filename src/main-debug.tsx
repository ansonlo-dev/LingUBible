import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

// 添加全局錯誤處理
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error, e.filename, e.lineno, e.colno);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

function DebugApp() {
  const [step, setStep] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setStep(s => s + 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [step]);

  const steps = [
    'React 應用初始化完成',
    '載入基本組件中...',
    '準備載入語言上下文...',
    '準備載入認證上下文...',
    '準備載入主應用...'
  ];

  const loadNextStep = async () => {
    try {
      if (step === 2) {
        // 測試載入語言上下文
        const { LanguageProvider } = await import('./contexts/LanguageContext');
        console.log('LanguageProvider 載入成功');
      } else if (step === 3) {
        // 測試載入認證上下文
        const { AuthProvider } = await import('./contexts/AuthContext');
        console.log('AuthProvider 載入成功');
      } else if (step === 4) {
        // 測試載入主應用
        const App = await import('./App');
        console.log('App 載入成功');
      }
    } catch (err) {
      console.error('載入步驟失敗:', err);
      setError(`步驟 ${step} 失敗: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  React.useEffect(() => {
    if (step >= 2 && step <= 4) {
      loadNextStep();
    }
  }, [step]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>LingUBible - 調試模式</h1>
      <div style={{ marginBottom: '20px' }}>
        <p><strong>當前步驟:</strong> {step}</p>
        <p><strong>狀態:</strong> {steps[step] || '完成'}</p>
        <p><strong>時間:</strong> {new Date().toLocaleString()}</p>
      </div>
      
      {error && (
        <div style={{ 
          background: '#fee', 
          border: '1px solid #fcc', 
          padding: '10px', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>錯誤:</strong> {error}
        </div>
      )}
      
      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '4px' }}>
        <h3>載入進度:</h3>
        <ul>
          {steps.map((stepText, index) => (
            <li key={index} style={{ 
              color: index <= step ? '#28a745' : '#6c757d',
              fontWeight: index === step ? 'bold' : 'normal'
            }}>
              {index <= step ? '✓' : '○'} {stepText}
            </li>
          ))}
        </ul>
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        如果載入停止在某個步驟，請檢查瀏覽器控制台的錯誤信息。
      </div>
    </div>
  );
}

console.log('開始載入 React 應用...');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DebugApp />
  </React.StrictMode>
); 