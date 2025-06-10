import { contextBridge, ipcRenderer } from 'electron';

console.log('[Preload] Preload script starting...');

// 检查contextBridge是否可用
if (!contextBridge) {
  console.error('[Preload] contextBridge不可用，无法暴露API');
}

// 调试信息
console.log('[Preload] 当前window:', typeof window);
console.log('[Preload] 当前document:', typeof document);

// 尝试暴露API
try {
  contextBridge.exposeInMainWorld('electronApi', {
    getConfig: () => {
      console.log('[Preload] window.electronApi.getConfig called');
      try {
        // 使用IPC与主进程通信
        return ipcRenderer.invoke('get-config');
      } catch (error) {
        console.error('[Preload] IPC调用失败:', error);
        // 返回备用数据
        return Promise.resolve({
          ticketName: '预加载票种 (备用)',
          checkResult: true,
          machineCount: 5,
          stationCount: 10,
          successCount: 150,
        });
      }
    },
    
    // 添加检票方法
    checkTicket: (ticketData) => {
      console.log('[Preload] window.electronApi.checkTicket called with:', ticketData);
      return ipcRenderer.invoke('check-ticket', ticketData);
    },

    // 添加监听检票更新事件的方法
    onTicketUpdated: (callback) => {
      console.log('[Preload] 注册检票更新监听器');
      // 移除之前的监听器以避免重复
      ipcRenderer.removeAllListeners('ticket-updated');
      // 添加新的监听器
      ipcRenderer.on('ticket-updated', (_, ticketData) => {
        console.log('[Preload] 收到检票更新事件:', ticketData);
        callback(ticketData);
      });
    },
    
    // 移除检票更新事件监听器的方法
    removeTicketListener: () => {
      console.log('[Preload] 移除检票更新监听器');
      ipcRenderer.removeAllListeners('ticket-updated');
    }
  });
  
  console.log('[Preload] electronApi成功暴露');
} catch (error) {
  console.error('[Preload] 暴露API失败:', error);
}

console.log('[Preload] Preload script finished');