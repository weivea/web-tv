import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import Player from './components/Player';
import ChannelList from './components/ChannelList';
import WebList from './components/WebList';

interface Channel {
  id: string;
  name: string;
  url: string;
}

type Tab = 'iptv' | 'webtv';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('iptv');

  // IPTV State
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);

  // Web TV State
  const [webSites, setWebSites] = useState<Channel[]>([]);
  const [currentWebSite, setCurrentWebSite] = useState<Channel | null>(null);

  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load channels from store
    window.ipcRenderer.getChannels().then((savedChannels) => {
      if (savedChannels && Array.isArray(savedChannels)) {
        setChannels(savedChannels);
        if (savedChannels.length > 0) {
          setCurrentChannel(savedChannels[0]);
        }
      }
    });

    // Load web sites from store
    window.ipcRenderer.getWebSites().then((savedSites) => {
      if (savedSites && Array.isArray(savedSites)) {
        setWebSites(savedSites);
        if (savedSites.length > 0) {
          setCurrentWebSite(savedSites[0]);
        }
      }
    });
  }, []);

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

  // Channel Handlers
  const handleAddChannel = (channel: Channel) => {
    const newChannels = [...channels, channel];
    setChannels(newChannels);
    window.ipcRenderer.saveChannels(newChannels);
    if (!currentChannel) {
      setCurrentChannel(channel);
    }
  };

  const handleImportChannels = (importedChannels: Channel[]) => {
    const newChannels = [...channels, ...importedChannels];
    setChannels(newChannels);
    window.ipcRenderer.saveChannels(newChannels);
    if (!currentChannel && newChannels.length > 0) {
      setCurrentChannel(newChannels[0]);
    }
  };

  const handleDeleteChannel = (id: string) => {
    const newChannels = channels.filter((c) => c.id !== id);
    setChannels(newChannels);
    window.ipcRenderer.saveChannels(newChannels);
    if (currentChannel?.id === id) {
      setCurrentChannel(newChannels.length > 0 ? newChannels[0] : null);
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

  const handleDeleteWebSite = (id: string) => {
    const newSites = webSites.filter((s) => s.id !== id);
    setWebSites(newSites);
    window.ipcRenderer.saveWebSites(newSites);
    if (currentWebSite?.id === id) {
      setCurrentWebSite(newSites.length > 0 ? newSites[0] : null);
    }
  };

  return (
    <div className="app-container" onMouseMove={handleMouseMove}>
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
              channels={channels}
              selectedChannelId={currentChannel?.id}
              onSelect={setCurrentChannel}
              onAdd={handleAddChannel}
              onImport={handleImportChannels}
              onDelete={handleDeleteChannel}
            />
          ) : (
            <WebList
              sites={webSites}
              selectedSiteId={currentWebSite?.id}
              onSelect={setCurrentWebSite}
              onAdd={handleAddWebSite}
              onDelete={handleDeleteWebSite}
            />
          )}
        </div>
      </div>

      <div className="player-layer" onClick={() => setSidebarVisible(false)}>
        {activeTab === 'iptv' ? (
          currentChannel ? (
            <Player url={currentChannel.url} />
          ) : (
            <div className="placeholder-text">
              Select or add a channel to play
            </div>
          )
        ) : currentWebSite ? (
          <>
            <webview
              src={currentWebSite.url}
              style={{ width: '100%', height: '100%' }}
            />
            <div className="webview-overlay" />
          </>
        ) : (
          <div className="placeholder-text">
            Select or add a website to view
          </div>
        )}
      </div>
    </div>
  );
}

// Add type definition for webview to avoid TS errors
declare global {
  namespace JSX {
    interface IntrinsicElements {
      webview: any;
    }
  }
}

export default App;
