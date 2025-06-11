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

  /** 第五行显示内容 (仅安卓闸机有效)  闸机通道名称 */
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
    cmd: 0, // Initial safe command, will hide .info div
    personnum: 0,
    line1: '',
    line2: '',
    line3: '',
    line4: '',
    line5: '',
    voice: '',
    filename: '',
    showcount: 0,
    title: '',
    entrycount: 0
  });

  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const lastVoiceRef = useRef<string>('');
  const voiceQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioSupported, setAudioSupported] = useState<boolean>(true); // Represents if SpeechSynthesis API is generally usable
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  // const [showInfoDetails, setShowInfoDetails] = useState<boolean>(false); // This state is no longer needed for this specific logic

  useEffect(() => {
    console.log('[App.tsx] Initial useEffect for voice setup running.');
    const audio = new Audio();
    audioRef.current = audio;

    if ('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
      const handleVoicesChanged = () => {
        try {
          const voices = window.speechSynthesis.getVoices();
          console.log('[App.tsx] Voices changed/loaded. Count:', voices.length, voices);
          setAvailableVoices(voices);
          if (voices.length === 0) {
            console.warn("[App.tsx] No voices found after onvoiceschanged. Speech synthesis will use fallback or fail if no fallback.");
            // If no voices are found, we consider speech synthesis not fully supported for speaking.
            setAudioSupported(false);
          } else {
            // Voices found, mark as supported. The speak function will pick one.
            setAudioSupported(true);
          }
        } catch (e) {
          console.error('[App.tsx] Error in handleVoicesChanged:', e);
          setAudioSupported(false);
        }
      };

      // Attempt to get voices immediately
      const initialVoices = window.speechSynthesis.getVoices();
      if (initialVoices.length > 0) {
        console.log('[App.tsx] Initial voices found:', initialVoices.length, initialVoices);
        setAvailableVoices(initialVoices);
        setAudioSupported(true);
      } else {
        console.log('[App.tsx] No initial voices, setting up onvoiceschanged listener.');
        window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
        // Fallback timeout if onvoiceschanged doesn't fire or doesn't populate voices
        const voiceLoadTimeout = setTimeout(() => {
          if (window.speechSynthesis.getVoices().length === 0 && availableVoices.length === 0) {
            console.warn('[App.tsx] Timeout: Still no voices after delay. Assuming speech synthesis not fully available for speaking.');
            setAudioSupported(false); // Mark as unsupported for speaking
          }
        }, 3000); // Check after 3 seconds
        return () => clearTimeout(voiceLoadTimeout); // Cleanup timeout
      }
    } else {
      console.warn('[App.tsx] SpeechSynthesis API not fully supported.');
      setAudioSupported(false);
    }

    return () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = null;
        }
    }
  }, []); // Runs once on mount

  const speakText = (text: string) => {
    const trimmedText = text?.trim(); // Trim whitespace
    console.log('[App.tsx] speakText called with:', `"${text}"`, `(trimmed: "${trimmedText}")`);
    if (!trimmedText) { // If trimmed text is empty, skip
      console.log('[App.tsx] speakText: trimmed text is empty, skipping.');
      return;
    }
    voiceQueueRef.current.push(trimmedText); // Push trimmed text to queue
    if (!isProcessingQueueRef.current) {
      processVoiceQueue();
    }
  };

  const processVoiceQueue = () => {
    console.log(`[App.tsx] processVoiceQueue called. Queue length: ${voiceQueueRef.current.length}, isProcessing: ${isProcessingQueueRef.current}`);
    if (voiceQueueRef.current.length === 0) {
      isProcessingQueueRef.current = false;
      console.log('[App.tsx] Voice queue empty, stopping processing.');
      return;
    }
    
    isProcessingQueueRef.current = true;
    const text = voiceQueueRef.current.shift()!;
    console.log(`[App.tsx] Processing voice from queue: "${text}"`);
    
    try {
      if (audioSupported && availableVoices.length > 0 && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined') {
        console.log('[App.tsx] Using SpeechSynthesis API to speak:', text);
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        const chineseVoice = availableVoices.find(voice => voice.lang.toLowerCase().startsWith('zh') || voice.name.toLowerCase().includes('chinese') || voice.name.toLowerCase().includes('中文'));
        if (chineseVoice) {
          utterance.voice = chineseVoice;
          console.log('[App.tsx] Using voice:', chineseVoice.name, chineseVoice.lang);
        } else {
          console.log('[App.tsx] No specific Chinese voice found, using default system voice (if any).');
        }
        utterance.lang = 'zh-CN'; 
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onstart = () => {
          console.log('[App.tsx] Speech started:', text);
          setIsSpeaking(true);
          lastVoiceRef.current = text;
        };
        
        utterance.onend = () => {
          console.log('[App.tsx] Speech ended:', text);
          setIsSpeaking(false);
          setTimeout(processVoiceQueue, 100);
        };
        
        utterance.onerror = (event) => {
          if (event.error !== 'canceled') {
            console.error('[App.tsx] SpeechSynthesisUtterance error:', event.error, event);
          }
          setIsSpeaking(false);
          setTimeout(processVoiceQueue, 100);
        };
        
        window.speechSynthesis.speak(utterance);
      } else if (audioRef.current) { 
        console.warn(`[App.tsx] SpeechSynthesis not usable (audioSupported: ${audioSupported}, availableVoices: ${availableVoices.length}). Attempting fallback audio for: "${text}"`);
        let audioSrc = '';
        if (text.includes('成功') || text.includes('请进') || text.includes('欢迎')) {
          audioSrc = 'audio/success.mp3'; 
        } else if (text.includes('无效') || text.includes('错误')) {
          audioSrc = 'audio/error.mp3'; 
        } else {
          audioSrc = 'audio/notify.mp3'; 
        }
        
        const currentAudioElement = audioRef.current;
        console.log('[App.tsx] Setting fallback audio src to (relative path):', audioSrc);
        currentAudioElement.src = audioSrc;

        // It's good practice to remove old listeners before adding new ones
        // if the same audio element is reused.
        const onCanPlayThrough = () => {
          console.log('[App.tsx] Fallback audio can play through for src:', currentAudioElement.currentSrc);
          try {
            console.log('[App.tsx] Attempting to call audioRef.current.play() for src:', currentAudioElement.currentSrc);
            const playPromise = currentAudioElement.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  console.log('[App.tsx] Fallback audio play() promise resolved (playback likely started for src):', currentAudioElement.currentSrc);
                })
                .catch(error => {
                  console.error('[App.tsx] Fallback audio play() promise rejected for src:', currentAudioElement.currentSrc, error.name, error.message, error);
                  setIsSpeaking(false);
                  setTimeout(processVoiceQueue, 100); 
                });
            } else {
                console.warn('[App.tsx] Fallback audio play() did not return a promise. Relying on events.');
            }
          } catch (playError) {
            console.error('[App.tsx] Error directly calling audioRef.current.play() for src:', currentAudioElement.currentSrc, playError);
            setIsSpeaking(false);
            setTimeout(processVoiceQueue, 100); 
          }
          currentAudioElement.removeEventListener('canplaythrough', onCanPlayThrough);
        };

        currentAudioElement.onplay = () => {
            console.log('[App.tsx] Fallback audio started playing:', currentAudioElement.currentSrc);
            setIsSpeaking(true);
            lastVoiceRef.current = text; 
        };
        currentAudioElement.onended = () => {
          console.log('[App.tsx] Fallback audio ended:', currentAudioElement.currentSrc);
          setIsSpeaking(false);
          setTimeout(processVoiceQueue, 100);
        };
        currentAudioElement.onerror = (e) => {
          const errorEvent = e as Event & { target?: { error?: MediaError | null } };
          console.error('[App.tsx] Fallback audio error for src:', currentAudioElement.currentSrc || audioSrc, 'Error object:', errorEvent, 'MediaError:', errorEvent.target?.error);
          setIsSpeaking(false);
          setTimeout(processVoiceQueue, 100);
          currentAudioElement.removeEventListener('canplaythrough', onCanPlayThrough); // Clean up listener on error too
        };
        
        console.log('[App.tsx] Adding canplaythrough listener and calling load() for fallback audio src:', audioSrc);
        currentAudioElement.addEventListener('canplaythrough', onCanPlayThrough, { once: true });
        currentAudioElement.load(); // Explicitly call load after setting src and attaching listeners

      } else {
        console.error('[App.tsx] No speech synthesis (or no voices/support) and no fallback audio element. Cannot play:', text);
        setIsSpeaking(false); 
        setTimeout(processVoiceQueue, 100); 
      }
    } catch (error) {
      console.error('[App.tsx] Uncaught error in processVoiceQueue main logic for text:', `"${text}"`, error);
      setIsSpeaking(false); 
      isProcessingQueueRef.current = false; 
      setTimeout(processVoiceQueue, 100);
    }
  };

  useEffect(() => {
    console.log('[App.tsx] Initial data fetch and listener setup useEffect running.');
    const fetchInitialData = async () => {
      console.log('[App.tsx] Attempting to fetch initial config via electronApi.getConfig...');
      if (window.electronApi && typeof window.electronApi.getConfig === 'function') {
        try {
          const data = await window.electronApi.getConfig();
          console.log('[App.tsx] getConfig returned:', data);
          if (data) {
            setTicketData(prev => ({ ...prev, ...data, line2: data.line2 || data.ticketName || '票务系统' }));
            // setShowInfoDetails(true); // No longer using setShowInfoDetails here
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
          if (newData) {
            setTicketData(prev => ({ ...prev, ...newData }));
            
            const effectiveVoice = newData.voice?.trim(); // Get voice and trim whitespace

            if (newData.cmd === 83 || newData.cmd === 82) { // Success commands
              if (effectiveVoice) {
                console.log('[App.tsx] Success cmd, using provided voice:', effectiveVoice);
                speakText(effectiveVoice);
              } else {
                console.log('[App.tsx] Success cmd, using default success voice.');
                speakText("检票成功! 请通行.");
              }
            } else { // Invalid commands (cmd is not 82 or 83)
              if (effectiveVoice) { 
                console.log('[App.tsx] Invalid cmd, using provided voice for error:', effectiveVoice);
                speakText(effectiveVoice);
              } else { 
                console.log('[App.tsx] Invalid cmd, using default invalid voice.');
                speakText("无效票!");
              }
            }
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

    return () => {
      console.log('[App.tsx] useEffect cleanup running for data fetch and listeners.');
      if (removeUpdateListener && typeof removeUpdateListener === 'function') {
        console.log('[App.tsx] Cleaning up onTicketUpdated listener.');
        try {
          removeUpdateListener();
        } catch (err) {
          console.error('[App.tsx] Error cleaning up onTicketUpdated listener:', err);
        }
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    const voiceToSpeak = ticketData.voice?.trim();
    if (voiceToSpeak && voiceToSpeak !== lastVoiceRef.current) {
      console.log('[App.tsx] ticketData.voice changed, queuing to speak (trimmed):', voiceToSpeak);
      speakText(voiceToSpeak);
    }
  }, [ticketData.voice]);

  return (
    <div className="container">
      <audio ref={audioRef} style={{ display: 'none' }} />

      <h1 className="title">欢迎光临</h1>
{/*      {error && <p style={{ color: 'red' }}>错误: {error}</p>}*/}
      <div className="card">
        <div className="left-section">
          <div className="logo-and-datetime-wrapper"> {/* New wrapper div */}
            <img src="/public/Group 1321318654@2x.png" alt="Logo" className="logo" />
            <p className="date-time">{new Date().toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }).replace(/\//g, '年').replace(/\//g, '月').replace(/\s/, '日 ')}</p>
          </div>
          {ticketData.cmd !== 0 && ( // Conditionally render the info div based on cmd
            <div className="info">
              {ticketData.cmd === 83 ? (
                  <>
                    <p className="success-message" style={{color: '#28a745'}}>
                      请进
                    </p>
                    <h2 className="ticket-type">{ticketData.line1}</h2>
                    {/* 修改开始 */}
                    <p className="ticket-stat-line">
                      <span className="stat-label">检票成功数：</span>
                      <span className="stat-value">{ticketData.personnum}</span>
                    </p>
                    <p className="ticket-stat-line">
                      <span className="stat-label">已检票数/购票数：</span>
                      <span className="stat-value">{ticketData.line2}</span>
                    </p>
                    {/* 修改结束 */}
                  </>
              ) : ( // This will now only be reached if cmd is not 0 and not 83 (e.g., 81 or other invalid commands)
                  <p className="success-message" style={{color: '#dc3545' }}>
                  无效票
                </p>
              )}
            </div>
          )}
        </div>
        <div className="right-section">
          <h3 className="gate">{ticketData.line5 || '闸机口'}</h3>
          <p className="machine-info">
            本机: <span className="count">{ticketData.entrycount}</span>
          </p>
          <p className="station-info">
            本站: <span className="count">{ticketData.showcount}</span>
          </p>

        </div>
      </div>
      <footer className="footer">云程票务</footer>
    </div>
  );
};

export default App;
