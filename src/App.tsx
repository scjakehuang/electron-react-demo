import React, { useState, useEffect } from 'react';
import './App.css';

interface TicketData {
  ticketName: string;
  checkResult: boolean;
  machineCount: number;
  stationCount: number;
  successCount: number;
}

// 调试信息
console.log('App.tsx 开始加载');
console.log('window.electronApi 是否存在:', !!window.electronApi);

const App: React.FC = () => {
  const [ticketData, setTicketData] = useState<TicketData>({
    ticketName: '加载中...',
    checkResult: false,
    machineCount: 0,
    stationCount: 0,
    successCount: 0
  });
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        console.log('正在尝试调用 window.electronApi.getConfig...');
        // 检查API是否存在
        if (!window.electronApi?.getConfig) {
          throw new Error('electronApi.getConfig 未定义');
        }
        
        const data = await window.electronApi.getConfig();
        console.log('获取到的数据:', data);
        
        setTicketData({
          ticketName: data.ticketName || '默认票种',
          checkResult: Boolean(data.checkResult),
          machineCount: Number(data.machineCount) || 0,
          stationCount: Number(data.stationCount) || 0,
          successCount: Number(data.successCount) || 0
        });
        setError(null);
      } catch (error) {
        console.error('获取配置失败:', error);
        setError(`错误: ${error instanceof Error ? error.message : String(error)}`);
        // 使用默认值
        setTicketData({
          ticketName: '本地数据 (错误恢复)',
          checkResult: true,
          machineCount: 1,
          stationCount: 1,
          successCount: 100
        });
      }
    };

    fetchTicketData();
  }, []);

  return (
    <div className="container">
      <h1 className="title">欢迎光临!</h1>
      <div className="card">
        <div className="left-section">
          <img src="/public/logo.png" alt="Logo" className="logo" />
          <div className="info">
            <p className="date-time">{new Date().toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }).replace(/\//g, '年').replace(/\//g, '月').replace(/\s/, '日 ')}</p>
            <h2 className="ticket-type">{ticketData.ticketName}</h2>
            <p className="success-message">
              {ticketData.checkResult ? '检票成功' : '无效票'}：
              <span className="success-count">{ticketData.successCount}</span>
            </p>
            <div className="background-image"></div>
          </div>
        </div>
        <div className="right-section">
          <h3 className="gate">闸机口1号</h3>
          <p className="machine-info">
            本机：<span className="count">{ticketData.machineCount}</span>
          </p>
          <p className="station-info">
            本站：<span className="count">{ticketData.stationCount}</span>
          </p>
        </div>
      </div>
      <footer className="footer">云程票务</footer>
    </div>
  );
};

export default App;