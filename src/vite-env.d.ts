/// <reference types="vite/client" />

interface Channel {
  id: string;
  name: string;
  url: string;
  cssSelector?: string;
}

interface Window {
  ipcRenderer: import('electron').IpcRenderer & {
    getChannels: () => Promise<Channel[]>;
    saveChannels: (channels: Channel[]) => Promise<void>;
    getWebSites: () => Promise<Channel[]>;
    saveWebSites: (sites: Channel[]) => Promise<void>;
    getLastState: () => Promise<{
      lastChannelId?: string;
      lastWebSiteId?: string;
      lastActiveTab?: 'iptv' | 'webtv';
    }>;
    saveLastState: (state: {
      lastChannelId?: string;
      lastWebSiteId?: string;
      lastActiveTab?: 'iptv' | 'webtv';
    }) => Promise<void>;
    fetchUrl: (url: string) => Promise<string>;
    minimizeWindow: () => void;
    maximizeWindow: () => void;
    closeWindow: () => void;
    toggleDevTools: () => void;
  };
}
