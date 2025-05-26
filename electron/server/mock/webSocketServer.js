import WebSocket, { WebSocketServer } from 'ws'
// 创建 WebSocket 服务器（绑定到同一 HTTP 服务）
const wss = new WebSocketServer({ port: 4000 });

// WebSocket 连接处理
wss.on('connection', (ws) => {
  console.log('WebSocket 客户端已连接');

  // 接收客户端消息
  ws.on('message', (message) => {
    console.log('收到消息:', message.toString());
    // 回复客户端（示例：原样返回消息）
    ws.send(`服务器收到：${message}`);
  });

  // 主动推送消息给客户端（如定时推送）
  const interval = setInterval(() => {
    ws.send(JSON.stringify({
      type: 'heartbeat',
      time: new Date().toISOString()
    }));
  }, 5000);

  // 连接关闭时清理资源
  ws.on('close', () => {
    clearInterval(interval);
    console.log('客户端断开连接');
  });
});


export default wss