import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import Player from './components/Player';
import ChannelList from './components/ChannelList';

interface Channel {
  id: string;
  name: string;
  url: string;
}

function App() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
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

  return (
    <div className="app-container" onMouseMove={handleMouseMove}>
      <div className={`sidebar-layer ${isSidebarVisible ? '' : 'hidden'}`}>
        <ChannelList
          channels={channels}
          selectedChannelId={currentChannel?.id}
          onSelect={setCurrentChannel}
          onAdd={handleAddChannel}
          onImport={handleImportChannels}
          onDelete={handleDeleteChannel}
        />
      </div>
      <div className="player-layer" onClick={() => setSidebarVisible(false)}>
        {currentChannel ? (
          <Player url={currentChannel.url} />
        ) : (
          <div
            style={{
              color: 'white',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            Select or add a channel to play
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
