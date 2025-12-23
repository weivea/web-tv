import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import Player from './components/Player';
import ChannelList from './components/ChannelList';
import WebList from './components/WebList';
import WebTV from './components/web-tv';
import TitleBar from './components/TitleBar';
import { parseM3U } from './utils/m3uParser';

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

type Tab = 'iptv' | 'webtv';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('iptv');

  // IPTV State
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [playlistChannels, setPlaylistChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);

  // Web TV State
  const [webSites, setWebSites] = useState<Channel[]>([]);
  const [currentWebSite, setCurrentWebSite] = useState<Channel | null>(null);

  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const [savedPlaylists, savedSites, lastState] = await Promise.all([
        window.ipcRenderer.getPlaylists(),
        window.ipcRenderer.getWebSites(),
        window.ipcRenderer.getLastState(),
      ]);

      if (savedPlaylists && Array.isArray(savedPlaylists)) {
        setPlaylists(savedPlaylists);
        if (savedPlaylists.length > 0) {
          const lastPlaylist = savedPlaylists.find(
            (p) => p.id === lastState.lastPlaylistId,
          );
          if (lastPlaylist) {
            handleSelectPlaylist(lastPlaylist, lastState.lastChannelId);
          }
        }
      }

      if (savedSites && Array.isArray(savedSites)) {
        setWebSites(savedSites);
        if (savedSites.length > 0) {
          const lastSite = savedSites.find(
            (s) => s.id === lastState.lastWebSiteId,
          );
          setCurrentWebSite(lastSite || savedSites[0]);
        }
      }

      if (lastState.lastActiveTab) {
        setActiveTab(lastState.lastActiveTab);
      }

      setIsLoaded(true);
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    window.ipcRenderer.saveLastState({
      lastPlaylistId: currentPlaylist?.id,
      lastChannelId: currentChannel?.id,
      lastWebSiteId: currentWebSite?.id,
      lastActiveTab: activeTab,
    });
  }, [currentPlaylist, currentChannel, currentWebSite, activeTab, isLoaded]);

  const handleSelectPlaylist = async (
    playlist: Playlist,
    restoreChannelId?: string,
  ) => {
    setCurrentPlaylist(playlist);
    setPlaylistChannels([]); // Clear while loading
    setCurrentChannel(null);

    try {
      const text = await window.ipcRenderer.fetchUrl(playlist.url);
      if (text.includes('#EXTM3U')) {
        const parsedChannels = parseM3U(text);
        const channels = parsedChannels.map((c, index) => ({
          id: Date.now().toString() + '-' + index,
          name: c.name,
          url: c.url,
        }));
        setPlaylistChannels(channels);

        if (restoreChannelId) {
          const restored = channels.find((c) => c.id === restoreChannelId);
          if (restored) setCurrentChannel(restored);
        }
      }
    } catch (error) {
      console.error('Failed to load playlist', error);
    }
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (isSidebarVisible) {
        timeoutRef.current = setTimeout(() => {
          setSidebarVisible(false);
        }, 5000);
      } else {
        if (e.clientX < window.innerWidth / 4) {
          setSidebarVisible(true);
          timeoutRef.current = setTimeout(() => {
            setSidebarVisible(false);
          }, 5000);
        }
      }
    },
    [isSidebarVisible],
  );

  // Playlist Handlers
  const handleAddPlaylist = (playlist: Playlist) => {
    const newPlaylists = [...playlists, playlist];
    setPlaylists(newPlaylists);
    window.ipcRenderer.savePlaylists(newPlaylists);
    if (!currentPlaylist) {
      handleSelectPlaylist(playlist);
    }
  };

  const handleImportPlaylists = (importedPlaylists: Playlist[]) => {
    const existingUrls = new Set(playlists.map((p) => p.url));
    const uniqueImported = importedPlaylists.filter(
      (p) => !existingUrls.has(p.url),
    );

    if (uniqueImported.length === 0) return;

    const newPlaylists = [...playlists, ...uniqueImported];
    setPlaylists(newPlaylists);
    window.ipcRenderer.savePlaylists(newPlaylists);
    if (!currentPlaylist && newPlaylists.length > 0) {
      handleSelectPlaylist(newPlaylists[0]);
    }
  };

  const handleDeletePlaylist = (id: string) => {
    const newPlaylists = playlists.filter((p) => p.id !== id);
    setPlaylists(newPlaylists);
    window.ipcRenderer.savePlaylists(newPlaylists);
    if (currentPlaylist?.id === id) {
      setCurrentPlaylist(null);
      setPlaylistChannels([]);
      setCurrentChannel(null);
    }
  };

  // Web Site Handlers
  const handleAddWebSite = (site: Channel) => {
    const newSites = [...webSites, site];
    setWebSites(newSites);
    window.ipcRenderer.saveWebSites(newSites);
    if (!currentWebSite) {
      setCurrentWebSite(site);
    }
  };

  const handleImportWebSites = (importedSites: Channel[]) => {
    const existingUrls = new Set(webSites.map((s) => s.url));
    const uniqueImportedSites = importedSites.filter(
      (s) => !existingUrls.has(s.url),
    );

    if (uniqueImportedSites.length === 0) {
      return;
    }

    const newSites = [...webSites, ...uniqueImportedSites];
    setWebSites(newSites);
    window.ipcRenderer.saveWebSites(newSites);
    if (!currentWebSite && newSites.length > 0) {
      setCurrentWebSite(newSites[0]);
    }
  };

  const handleDeleteWebSite = (id: string) => {
    const newSites = webSites.filter((s) => s.id !== id);
    setWebSites(newSites);
    window.ipcRenderer.saveWebSites(newSites);
    if (currentWebSite?.id === id) {
      setCurrentWebSite(newSites.length > 0 ? newSites[0] : null);
    }
  };

  const handleReorderWebSites = (newSites: Channel[]) => {
    setWebSites(newSites);
    window.ipcRenderer.saveWebSites(newSites);
  };

  return (
    <div className="app-container" onMouseMove={handleMouseMove}>
      <TitleBar />
      <div className={`sidebar-layer ${isSidebarVisible ? '' : 'hidden'}`}>
        <div className="sidebar-tabs">
          <button
            className={`tab-btn ${activeTab === 'iptv' ? 'active' : ''}`}
            onClick={() => setActiveTab('iptv')}
          >
            IPTV
          </button>
          <button
            className={`tab-btn ${activeTab === 'webtv' ? 'active' : ''}`}
            onClick={() => setActiveTab('webtv')}
          >
            Web TV
          </button>
        </div>

        <div className="sidebar-content">
          {activeTab === 'iptv' ? (
            <ChannelList
              playlists={playlists}
              selectedPlaylistId={currentPlaylist?.id}
              channels={playlistChannels}
              selectedChannelId={currentChannel?.id}
              onSelectPlaylist={(p) => handleSelectPlaylist(p)}
              onAddPlaylist={handleAddPlaylist}
              onImportPlaylists={handleImportPlaylists}
              onDeletePlaylist={handleDeletePlaylist}
              onSelectChannel={setCurrentChannel}
            />
          ) : (
            <WebList
              sites={webSites}
              selectedSiteId={currentWebSite?.id}
              onSelect={setCurrentWebSite}
              onAdd={handleAddWebSite}
              onImport={handleImportWebSites}
              onDelete={handleDeleteWebSite}
              onReorder={handleReorderWebSites}
            />
          )}
        </div>
      </div>

      <div className="player-layer" onClick={() => setSidebarVisible(false)}>
        {activeTab === 'iptv' &&
          (currentChannel ? (
            <Player url={currentChannel.url} />
          ) : (
            <div className="placeholder-text">
              Select or add a channel to play
            </div>
          ))}

        <WebTV isActive={activeTab === 'webtv'} currentSite={currentWebSite} />
      </div>
    </div>
  );
}

export default App;
