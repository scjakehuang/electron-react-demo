/// <reference types="vite/client" />

interface Window {
  // expose in the `electron/preload/index.ts`
  ipcRenderer: import('electron').IpcRenderer,
  electronApi: {
    getWindowInfo: () => Promise<any>,
    httpRequest: (url: string, method: string, data: any) => Promise<any>,
    lauchApp: (appPath: string, args: string[]) => Promise<any>,
    getAppPath: (appName: string) => Promise<any>,
    getConfig: () => Promise<any>,
  }
}
