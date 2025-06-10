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

// 调试信息
console.log('App.tsx 开始加载');
console.log('window.electronApi 是否存在:', !!window.electronApi);

const App: React.FC = () => {
  const [ticketData, setTicketData] = useState<TicketData>({
    cmd: 82,
    personnum: 1,
    line1: '成人票',
    line2: '加载中...',
    line3: '请通行',
    line4: '云程票务',
    line5: '祝您游玩愉快',
    voice: '请进',
    filename: 'welcome.jpg',
    showcount: 1,
    title: '今日入场',
    entrycount: 0
  });
  
  const [error, setError] = useState<string | null>(null);
  // 添加语音播报状态管理
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const lastVoiceRef = useRef<string>('');

  // 添加语音队列
  const voiceQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef<boolean>(false);

  // 添加音频元素引用
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioSupported, setAudioSupported] = useState<boolean>(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // 音频初始化和检测
  useEffect(() => {
    // 创建音频元素用于备用播放方式
    const audio = new Audio();
    audioRef.current = audio;
    
    // 检测语音合成API是否可用
    if ('speechSynthesis' in window) {
      console.log('语音合成API可用');


      // 获取可用的语音列表
      const getVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('可用语音列表:', voices);
        setAvailableVoices(voices);
        
        // 找到中文语音
        const chineseVoice = voices.find(voice => 
          voice.lang.includes('zh') || 
          voice.name.includes('Chinese') || 
          voice.name.includes('中文')
        );
        
        if (chineseVoice) {
          console.log('找到中文语音:', chineseVoice.name);
        } else {
          console.warn('未找到中文语音，将使用默认语音');
        }
        
        // 测试语音是否工作
        try {
          const testUtterance = new SpeechSynthesisUtterance('测试');
          if (chineseVoice) {
            testUtterance.voice = chineseVoice;
          }
          testUtterance.volume = 0.01; // 极小音量进行测试
          testUtterance.onend = () => console.log('测试语音播放成功');
          testUtterance.onerror = (err) => console.error('测试语音播放失败:', err);
          window.speechSynthesis.speak(testUtterance);
        } catch (err) {
          console.error('语音测试失败:', err);
          setAudioSupported(false);
        }
      };
      
      // 语音列表可能需要一段时间才能加载
      if (window.speechSynthesis.getVoices().length > 0) {
        getVoices();
      } else {
        window.speechSynthesis.onvoiceschanged = getVoices;
      }
      
    } else {
      console.warn('当前环境不支持语音合成API');
      setAudioSupported(false);
    }
  }, []);

  // 改进的语音播报函数，使用队列方式
  const speakText = (text: string) => {
    console.log('添加语音到队列:', text);
    if (!text) return; // 避免空文本
    
    // 将语音添加到队列
    voiceQueueRef.current.push(text);
    
    // 如果不在处理队列，开始处理
    if (!isProcessingQueueRef.current) {
      processVoiceQueue();
    }
  };
  
  // 处理语音队列
  const processVoiceQueue = () => {
    if (voiceQueueRef.current.length === 0) {
      isProcessingQueueRef.current = false;
      return;
    }
    
    isProcessingQueueRef.current = true;
    const text = voiceQueueRef.current.shift()!;
    
    // 避免重复播报相同内容
    if (text === lastVoiceRef.current && isSpeaking) {
      // 继续处理队列中的下一个
      processVoiceQueue();
      return;
    }

    try {
      // 如果Web Speech API可用且有可用的语音
      if (audioSupported && 'speechSynthesis' in window) {
        console.log('使用语音合成API播放:', text);
        
        // 停止当前正在播放的语音
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        
        // 选择中文语音
        const chineseVoice = availableVoices.find(voice => 
          voice.lang.includes('zh') || 
          voice.name.includes('Chinese') || 
          voice.name.includes('中文')
        );
        
        if (chineseVoice) {
          utterance.voice = chineseVoice;
        }
        
        // 设置语音参数
        utterance.lang = 'zh-CN'; // 设置中文
        utterance.rate = 1.0;     // 语速
        utterance.pitch = 1.0;    // 音高
        utterance.volume = 1.0;   // 音量
        
        // 开始和结束事件处理
        utterance.onstart = () => {
          console.log('语音播放开始:', text);
          setIsSpeaking(true);
          lastVoiceRef.current = text;
        };
        
        utterance.onend = () => {
          console.log('语音播放结束:', text);
          setIsSpeaking(false);
          // 播放完成后处理队列中的下一条语音
          setTimeout(processVoiceQueue, 100);
        };
        
        utterance.onerror = (event) => {
          // 增强错误报告，捕获更多错误信息
          if (event.error !== 'canceled') {
            console.error('语音播放错误:', event.error, '详情:', event);
          }
          setIsSpeaking(false);
          setAudioSupported(false); // 标记为不支持，尝试备用方案
          // 错误后也继续处理队列
          setTimeout(processVoiceQueue, 100);
        };
        
        // 播放语音
        window.speechSynthesis.speak(utterance);
      } else {
        // 备用方案：使用Audio API播放预设的音频
        console.warn('使用备用音频方法播放:', text);
        
        // 根据文本内容选择不同的音频
        let audioSrc = '';
        if (text.includes('成功') || text.includes('请进') || text.includes('欢迎')) {
          audioSrc = 'public/audio/success.mp3';
        } else if (text.includes('无效') || text.includes('错误')) {
          audioSrc = 'public/audio/error.mp3';
        } else {
          audioSrc = 'public/audio/notify.mp3';
        }
        
        if (audioRef.current) {
          audioRef.current.src = audioSrc;
          audioRef.current.onplay = () => {
            console.log('备用音频开始��放');
            setIsSpeaking(true);
          };
          audioRef.current.onended = () => {
            console.log('备用音频播放结束');
            setIsSpeaking(false);
            setTimeout(processVoiceQueue, 100);
          };
          audioRef.current.onerror = (e) => {
            console.error('备用音频播放失败:', e);
            setIsSpeaking(false);
            setTimeout(processVoiceQueue, 100);
          };
          
          // 播放音频
          const playPromise = audioRef.current.play();
          if (playPromise) {
            playPromise.catch(error => {
              console.error('备用音频播放被拒绝:', error);
              setIsSpeaking(false);
              setTimeout(processVoiceQueue, 100);
            });
          }
        } else {
          console.error('音频元素不可用');
          setIsSpeaking(false);
          setTimeout(processVoiceQueue, 100);
        }
      }
    } catch (error) {
      console.error('语音播放发生异��:', error);
      setIsSpeaking(false);
      setTimeout(processVoiceQueue, 100);
    }
  };

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
        
        // 适配新的TicketData结构
        setTicketData({
          cmd: data.cmd || 82,
          personnum: data.personnum || 1,
          line1: data.line1 || '欢迎光临',
          line2: data.line2 || data.ticketName || '云程票务',
          line3: data.line3 || '请通行',
          line4: data.line4 || '',
          line5: data.line5 || '',
          voice: data.voice || '请进',
          filename: data.filename || 'welcome.jpg',
          showcount: data.showcount || 1,
          title: data.title || '今日��场',
          entrycount: data.entrycount || data.successCount || 0
        });
        setError(null);
      } catch (error) {
        console.error('获取配置失败:', error);
        setError(`错误: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    fetchTicketData();
    
    // 注册检票更新事件监听器
    if (window.electronApi?.onTicketUpdated) {
      console.log('注册检票更新监听器');
      window.electronApi.onTicketUpdated((newData) => {
        console.log('收到检票更新:', newData);
        // 适配新的TicketData结构
        setTicketData({
          cmd: newData.cmd,
          personnum: newData.personnum,
          line1: newData.line1,
          line2: newData.line2,
          line3: newData.line3,
          line4: newData.line4,
          line5: newData.line5,
          voice: newData.voice,
          filename: newData.filename,
          showcount: newData.showcount,
          title: newData.title,
          entrycount: newData.entrycount
        });
        
        // 播放语音提示，优先使用接收到的voice，否则根据cmd值播放默认提示音
        if (newData.voice) {
          speakText(newData.voice);
        } else if (newData.cmd === 83 || newData.cmd === 82) {
          speakText("检票成功! 请通行.");
        } else {
          speakText("无效票!");
        }
      });
    } else {
      console.warn('electronApi.onTicketUpdated 未定义，无法接收实时更新');
    }
    
    // 组件卸载时清除监听器和语音合成
    return () => {
      if (window.electronApi?.removeTicketListener) {
        window.electronApi.removeTicketListener();
      }
      // 停止所有语音播报
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  
  return (
    <div className="container">
      {/* 添加隐藏的音频元素 */}
      <audio ref={audioRef} style={{ display: 'none' }} />
      
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
            <h2 className="ticket-type">{ticketData.line1}</h2>
            <p className="success-message">
              {ticketData.cmd === 83 ? '检票成功' : '无效票'}：
              <span className="success-count">{ticketData.personnum}</span>
            </p>
          </div>
        </div>
        <div className="right-section">
          <h3 className="gate">{ticketData.line5}</h3>
          <p className="machine-info">
            本站: <span className="count">{ticketData.showcount}</span>
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
