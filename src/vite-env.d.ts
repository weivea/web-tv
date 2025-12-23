/// <reference types="vite/client" />

interface Channel {
  id: string;
  name: string;
  url: string;
  cssSelector?: string;
}

interface Playlist {
  id: string;
  name: string;
  url: string;
  count?: number;
}

interface Window {
  ipcRenderer: import('electron').IpcRenderer & {
    getPlaylists: () => Promise<Playlist[]>;
    savePlaylists: (playlists: Playlist[]) => Promise<void>;
    getWebSites: () => Promise<Channel[]>;
    saveWebSites: (sites: Channel[]) => Promise<void>;
    getLastState: () => Promise<{
      lastPlaylistId?: string;
      lastChannelId?: string;
      lastWebSiteId?: string;
      lastActiveTab?: 'iptv' | 'webtv';
    }>;
    saveLastState: (state: {
      lastPlaylistId?: string;
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
