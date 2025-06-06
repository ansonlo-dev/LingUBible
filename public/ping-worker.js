// Web Worker for background ping
let pingInterval = null;
let isActive = false;
let currentConfig = null;

// 監聽主線程消息
self.addEventListener('message', function(e) {
  const { type, data } = e.data;

  switch (type) {
    case 'START_PING':
      startPing(data);
      break;
    case 'STOP_PING':
      stopPing();
      break;
    case 'PING_NOW':
      sendPing(data);
      break;
    default:
      console.log('Unknown message type:', type);
  }
});

function startPing(config) {
  if (isActive) {
    stopPing();
  }

  isActive = true;
  currentConfig = config;
  const { sessionId, interval } = config;

  console.log(`Worker: 開始 ping，會話: ${sessionId}，間隔: ${interval / 1000} 秒`);

  // 立即發送一次 ping
  sendPing(config);

  // 設置定期 ping
  pingInterval = setInterval(() => {
    sendPing(config);
  }, interval);
}

function stopPing() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
  isActive = false;
  currentConfig = null;
  console.log('Worker: Ping 已停止');
}

async function sendPing(config) {
  const { sessionId, endpoint, projectId } = config;

  try {
    // 首先嘗試獲取現有會話
    const listResponse = await fetch(`${endpoint}/databases/user-stats-db/collections/user-sessions/documents`, {
      method: 'GET',
      headers: {
        'X-Appwrite-Project': projectId,
        'Content-Type': 'application/json',
      }
    });

    if (!listResponse.ok) {
      throw new Error(`獲取會話列表失敗: HTTP ${listResponse.status}`);
    }

    const sessions = await listResponse.json();
    const existingSession = sessions.documents.find(doc => doc.sessionId === sessionId);

    if (existingSession) {
      // 更新現有會話的 lastPing
      const updateResponse = await fetch(`${endpoint}/databases/user-stats-db/collections/user-sessions/documents/${existingSession.$id}`, {
        method: 'PATCH',
        headers: {
          'X-Appwrite-Project': projectId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lastPing: new Date().toISOString()
        })
      });

      if (updateResponse.ok) {
        self.postMessage({
          type: 'PING_SUCCESS',
          data: { sessionId, timestamp: new Date().toISOString(), action: 'updated' }
        });
      } else {
        throw new Error(`更新會話失敗: HTTP ${updateResponse.status}`);
      }
    } else {
      // 會話不存在，可能已過期或被清理
      console.warn(`Worker: 會話 ${sessionId} 不存在，可能已過期`);
      self.postMessage({
        type: 'PING_ERROR',
        data: { sessionId, error: '會話不存在或已過期' }
      });
    }

  } catch (error) {
    console.error('Worker ping 失敗:', error);
    self.postMessage({
      type: 'PING_ERROR',
      data: { sessionId, error: error.message }
    });
  }
}

// 定期向主線程報告狀態
setInterval(() => {
  if (isActive && currentConfig) {
    self.postMessage({
      type: 'WORKER_STATUS',
      data: { 
        isActive, 
        sessionId: currentConfig.sessionId,
        timestamp: new Date().toISOString() 
      }
    });
  }
}, 30000); // 每 30 秒報告一次

// Worker 啟動消息
self.postMessage({
  type: 'WORKER_READY',
  data: { timestamp: new Date().toISOString() }
});

console.log('Ping Worker 已啟動並準備就緒'); 