import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args),
    );
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },

  // Store API
  getChannels: () => ipcRenderer.invoke('get-channels'),
  saveChannels: (channels: any) =>
    ipcRenderer.invoke('save-channels', channels),
  getWebSites: () => ipcRenderer.invoke('get-web-sites'),
  saveWebSites: (sites: any) => ipcRenderer.invoke('save-web-sites', sites),
  getLastState: () => ipcRenderer.invoke('get-last-state'),
  saveLastState: (state: any) => ipcRenderer.invoke('save-last-state', state),

  // Window Controls
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  toggleDevTools: () => ipcRenderer.send('toggle-dev-tools'),
});
