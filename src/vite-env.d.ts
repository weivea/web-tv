/// <reference types="vite/client" />

interface Channel {
  id: string;
  name: string;
  url: string;
}

interface Window {
  ipcRenderer: import('electron').IpcRenderer & {
    getChannels: () => Promise<Channel[]>;
    saveChannels: (channels: Channel[]) => Promise<void>;
    getWebSites: () => Promise<Channel[]>;
    saveWebSites: (sites: Channel[]) => Promise<void>;
  };
}
