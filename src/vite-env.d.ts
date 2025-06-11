/// <reference types="vite/client" />

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
    onTicketUpdated: (callback: (data: any) => void) => (() => void); // Ensure it returns a function for cleanup
    removeTicketListener: () => void;
    
    // 添加其他组件中使用的方法定义
    userConfig: (action: string, value?: any) => Promise<any>;
    httpRequest: (url: string, method: string, params?: any) => Promise<any>;
    lauchApp: (appName: string, args?: string[]) => Promise<any>;
    getAppPath: (appName: string) => Promise<string>;
    getWindowInfo: () => Promise<any>;
  };
  
  // 添加ipcRenderer接口用于其他组件
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
