
window.ipcRenderer.on('main-process-message', (_event, ...args) => {
  console.log('渲染进程[Receive Main-process message]:', ...args)
})

window.ipcRenderer.on('ipc-message', (_event, ...args) => {
  console.log('来自主进程的消息:', ...args)
})
