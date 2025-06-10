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
  }
  
  // 确保TypeScript认识SpeechSynthesis API
  speechSynthesis: SpeechSynthesis;
}
