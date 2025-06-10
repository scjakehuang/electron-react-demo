/// <reference types="vite/client" />

// 添加SpeechSynthesis类型声明，以防TypeScript报错
interface Window {
  electronApi?: {
    getConfig: () => Promise<{
      cmd?: number;
      personnum?: number;
      line1?: string;
      line2?: string;
      line3?: string;
      line4?: string;
      line5?: string;
      voice?: string;
      filename?: string;
      showcount?: number;
      title?: string;
      entrycount?: number;
      ticketName?: string;
      checkResult?: boolean;
      machineCount?: number;
      stationCount?: number;
      successCount?: number;
    }>;
    checkTicket: (data: any) => Promise<any>;
    onTicketUpdated: (callback: (data: any) => void) => void;
    removeTicketListener: () => void;
  };
  
  // 添加ipcRenderer接口用于update组件
  ipcRenderer?: {
    on: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
    send: (channel: string, ...args: any[]) => void;
    invoke: (channel: string, ...args: any[]) => Promise<any>;
    off: (channel: string, listener: (event: any, ...args: any[]) => void) => void;
    removeAllListeners: (channel: string) => void;
  };
  
  // 确保TypeScript认识SpeechSynthesis API
  speechSynthesis: SpeechSynthesis;
}
