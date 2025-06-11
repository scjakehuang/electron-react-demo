import { contextBridge, ipcRenderer } from 'electron';

console.log('[Preload Script] Preload script executing...');

try {
  contextBridge.exposeInMainWorld('electronApi', {
    getConfig: () => {
      console.log('[Preload Script] electronApi.getConfig called by renderer.');
      return ipcRenderer.invoke('get-config');
    },
    checkTicket: (ticketData: any) => {
      console.log('[Preload Script] electronApi.checkTicket called by renderer with data:', ticketData);
      return ipcRenderer.invoke('check-ticket', ticketData);
    },
    onTicketUpdated: (callback: (data: any) => void) => {
      console.log('[Preload Script] electronApi.onTicketUpdated listener being set up by renderer.');
      const listener = (_: any, data: any) => callback(data);
      ipcRenderer.on('ticket-updated', listener);
      // Return a function to remove the listener
      return () => {
        console.log('[Preload Script] Removing "ticket-updated" listener.');
        ipcRenderer.removeListener('ticket-updated', listener);
      };
    },
    removeTicketListener: () => { // This might be redundant if onTicketUpdated returns a remover
      console.log('[Preload Script] electronApi.removeTicketListener called by renderer.');
      ipcRenderer.removeAllListeners('ticket-updated');
    }
  });
  console.log('[Preload Script] electronApi successfully exposed to main world.');
} catch (error) {
  console.error('[Preload Script] Error exposing electronApi:', error);
}

// Expose ipcRenderer for other components if they directly use it (as seen in build errors)
// This is generally less secure than specific bridged methods but matches previous error context.
try {
    contextBridge.exposeInMainWorld('ipcRenderer', {
        on: (channel: string, func: (...args: any[]) => void) => {
            ipcRenderer.on(channel, (event, ...args) => func(...args));
        },
        send: (channel: string, ...args: any[]) => {
            ipcRenderer.send(channel, ...args);
        },
        invoke: (channel: string, ...args: any[]) => {
            return ipcRenderer.invoke(channel, ...args);
        },
        off: (channel: string, func: (...args: any[]) => void) => {
            ipcRenderer.removeListener(channel, func);
        },
        removeAllListeners: (channel: string) => {
            ipcRenderer.removeAllListeners(channel);
        }
    });
    console.log('[Preload Script] ipcRenderer successfully exposed to main world.');
} catch (error) {
    console.error('[Preload Script] Error exposing ipcRenderer:', error);
}


console.log('[Preload Script] Preload script execution finished.');
