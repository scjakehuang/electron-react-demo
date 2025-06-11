import React, { useState, useEffect, useRef } from 'react';
import './App.css';

interface TicketData {
  /** 闸机指令代码 (必须参数)  81-无效指令 82-直接开闸指令【暂时没有用】 83缓冲开闸指令*/
  cmd: number;

  /** 允许通行人数 (0表示不限) */
  personnum: number;

  /** 第一行显示内容 (支持普通/安卓闸机)  票名称 */
  line1: string;

  /** 第二行显示内容 (支持普通/安卓闸机) 已检票数/已购票数 */
  line2: string;

  /** 第三行显示内容 (支持普通/安卓闸机) */
  line3: string;

  /** 第四行显示内容 (仅安卓闸机有效) */
  line4: string;

  /** 第五行显示内容 (仅安卓闸机有效)  闸机设备名称 */
  line5: string;

  /** 语音提示文件路径/内容 */
  voice: string;

  /**
   * 显示图片文件名 (仅安卓闸机有效)
   * 要求：图片必须存在于闸机监控电脑指定目录
   */
  filename: string;

  /**
   * 人数显示开关：  本站今日已检票数
   * - 0: 不显示
   * - 1: 显示
   * (仅普通闸机有效)
   */
  showcount: number;

  /** 人数统计标题 (例："今日入场") */
  title: string;

  /** 已通行人数统计值  本机今日已检票数 */
  entrycount: number;
}

console.log('[App.tsx] Script start. window.electronApi available:', !!window.electronApi);

const App: React.FC = () => {
  console.log('[App.tsx] App component rendering/re-rendering.');
  const [ticketData, setTicketData] = useState<TicketData>({
    cmd: 81, // Initial safe command
    personnum: 0,
    line1: '系统初始化中...',
    line2: '请稍候',
    line3: '',
    line4: '',
    line5: '设备号---',
    voice: '系统启动',
    filename: '',
    showcount: 0,
    title: '统计信息',
    entrycount: 0
  });
  
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const lastVoiceRef = useRef<string>('');
  const voiceQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioSupported, setAudioSupported] = useState<boolean>(true); // Assume supported initially
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Simplified initial useEffect for logging
  useEffect(() => {
    console.log('[App.tsx] Initial useEffect running.');
    console.log('[App.tsx] window.electronApi in useEffect:', window.electronApi);

    const fetchInitialData = async () => {
      console.log('[App.tsx] Attempting to fetch initial config via electronApi.getConfig...');
      if (window.electronApi && typeof window.electronApi.getConfig === 'function') {
        try {
          const data = await window.electronApi.getConfig();
          console.log('[App.tsx] getConfig returned:', data);
          if (data) { // Check if data is not null/undefined
            setTicketData(prev => ({ ...prev, ...data, line2: data.line2 || data.ticketName || '票务系统' }));
          } else {
            console.warn('[App.tsx] getConfig returned null or undefined data.');
            setError('无法获取初始配置。');
          }
        } catch (err) {
          console.error('[App.tsx] Error calling electronApi.getConfig:', err);
          setError(`获取初始配置失败: ${err instanceof Error ? err.message : String(err)}`);
        }
      } else {
        console.error('[App.tsx] window.electronApi.getConfig is not available.');
        setError('Electron API (getConfig) 不可用。');
      }
    };

    fetchInitialData();

    let removeUpdateListener: (() => void) | undefined;
    if (window.electronApi && typeof window.electronApi.onTicketUpdated === 'function') {
      console.log('[App.tsx] Setting up onTicketUpdated listener...');
      try {
         removeUpdateListener = window.electronApi.onTicketUpdated((newData) => {
          console.log('[App.tsx] Received ticket update via onTicketUpdated:', newData);
          if (newData) { // Check if newData is not null/undefined
            setTicketData(prev => ({ ...prev, ...newData }));
            // Temporarily disable voice to isolate crash
            // if (newData.voice) speakText(newData.voice);
          } else {
            console.warn('[App.tsx] onTicketUpdated received null or undefined data.');
          }
        });
        console.log('[App.tsx] onTicketUpdated listener set up.');
      } catch (err) {
        console.error('[App.tsx] Error setting up onTicketUpdated listener:', err);
      }
    } else {
      console.error('[App.tsx] window.electronApi.onTicketUpdated is not available.');
    }

    // Temporarily disable audio/speech synthesis setup to isolate crash
    // console.log('[App.tsx] Setting up audio and speech synthesis...');
    // const audio = new Audio();
    // audioRef.current = audio;
    // if ('speechSynthesis' in window) { ... } else { setAudioSupported(false); }

    return () => {
      console.log('[App.tsx] useEffect cleanup running.');
      if (removeUpdateListener && typeof removeUpdateListener === 'function') {
        console.log('[App.tsx] Cleaning up onTicketUpdated listener.');
        try {
          removeUpdateListener();
        } catch (err) {
          console.error('[App.tsx] Error cleaning up onTicketUpdated listener:', err);
        }
      }
      // if ('speechSynthesis' in window) { window.speechSynthesis.cancel(); }
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  // speakText and processVoiceQueue functions are complex and might be a source of issues on Win7.
  // For now, let's assume they are not called due to the above simplifications.
  // If the app still crashes, these are not the primary cause of the *initial* crash

  const speakText = (text: string) => {
    console.log('[App.tsx] speakText called with:', text);
    // Actual speech logic temporarily disabled for stability testing
  };

  return (
    <div className="container">
      {/* <audio ref={audioRef} style={{ display: 'none' }} /> */}
      
      <h1 className="title">欢迎光临!</h1>
      {error && <p style={{ color: 'red' }}>错误: {error}</p>}
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
            <h2 className="ticket-type">{ticketData.line1}</h2>
            <p className="success-message">
              {ticketData.cmd === 83 ? `检票成功 (${ticketData.line3})` : `无效票 (${ticketData.line3})`}：
              <span className="success-count">{ticketData.personnum}</span>
            </p>
          </div>
        </div>
        <div className="right-section">
          <h3 className="gate">{ticketData.line5 || '闸机口'}</h3>
          <p className="machine-info">
            {ticketData.title || '本站'}: <span className="count">{ticketData.showcount}</span>
          </p>
          <p className="station-info">
            本机: <span className="count">{ticketData.entrycount}</span>
          </p>
        </div>
      </div>
      <footer className="footer">云程票务</footer>
    </div>
  );
};

export default App;
