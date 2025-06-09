// Web Worker for background ping functionality
let pingIntervals = new Map();
let endpoint = '';
let projectId = '';

// 監聽主線程消息
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  switch (type) {
    case 'START_PING':
      startPing(data);
      break;
    case 'STOP_PING':
      stopAllPings();
      break;
    case 'WORKER_STATUS':
      sendStatus();
      break;
    default:
      console.log('Unknown message type:', type);
  }
};

// 開始 ping
function startPing(data) {
  const { sessionId, interval, endpoint: ep, projectId: pid } = data;
  
  endpoint = ep;
  projectId = pid;
  
  // 如果已經有這個會話的 ping，先停止它
  if (pingIntervals.has(sessionId)) {
    clearInterval(pingIntervals.get(sessionId));
  }
  
  // 開始新的 ping 間隔
  const intervalId = setInterval(() => {
    sendPing(sessionId);
  }, interval);
  
  pingIntervals.set(sessionId, intervalId);
  
  // 立即發送一次 ping
  sendPing(sessionId);
  
  self.postMessage({
    type: 'WORKER_STATUS',
    data: { message: `Started ping for session ${sessionId}`, sessionId }
  });
}

// 發送 ping 請求
async function sendPing(sessionId) {
  try {
    const response = await fetch(`${endpoint}/databases/${projectId}/collections/user-sessions/documents/${sessionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': projectId
      },
      body: JSON.stringify({
        lastPing: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      self.postMessage({
        type: 'PING_SUCCESS',
        data: { sessionId, timestamp: new Date().toISOString() }
      });
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'PING_ERROR',
      data: { sessionId, error: error.message }
    });
  }
}

// 停止所有 ping
function stopAllPings() {
  pingIntervals.forEach((intervalId, sessionId) => {
    clearInterval(intervalId);
    self.postMessage({
      type: 'WORKER_STATUS',
      data: { message: `Stopped ping for session ${sessionId}`, sessionId }
    });
  });
  pingIntervals.clear();
}

// 發送狀態信息
function sendStatus() {
  self.postMessage({
    type: 'WORKER_STATUS',
    data: {
      activeSessions: Array.from(pingIntervals.keys()),
      totalSessions: pingIntervals.size
    }
  });
}

// 錯誤處理
self.onerror = function(error) {
  self.postMessage({
    type: 'WORKER_ERROR',
    data: { error: error.message }
  });
}; 