import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trash2, Plus, Upload, Download, Play } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  url: string;
}

interface Playlist {
  id: string;
  name: string;
  url: string;
}

interface ChannelListProps {
  playlists: Playlist[];
  selectedPlaylistId?: string;
  channels: Channel[];
  selectedChannelId?: string;
  onSelectPlaylist: (playlist: Playlist) => void;
  onAddPlaylist: (playlist: Playlist) => void;
  onImportPlaylists: (playlists: Playlist[]) => void;
  onDeletePlaylist: (id: string) => void;
  onSelectChannel: (channel: Channel) => void;
}

const ChannelList: React.FC<ChannelListProps> = ({
  playlists,
  selectedPlaylistId,
  channels,
  selectedChannelId,
  onSelectPlaylist,
  onAddPlaylist,
  onImportPlaylists,
  onDeletePlaylist,
  onSelectChannel,
}) => {
  const [view, setView] = useState<'playlists' | 'channels'>('playlists');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistUrl, setNewPlaylistUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedPlaylistId) {
      setView('channels');
    } else {
      setView('playlists');
    }
  }, [selectedPlaylistId]);

  const handleAdd = () => {
    if (newPlaylistName && newPlaylistUrl) {
      onAddPlaylist({
        id: Date.now().toString(),
        name: newPlaylistName,
        url: newPlaylistUrl,
      });
      setNewPlaylistName('');
      setNewPlaylistUrl('');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const json = JSON.parse(content);
        if (Array.isArray(json)) {
          const imported = json
            .filter((item: any) => item.name && item.url)
            .map((item: any, index: number) => ({
              id: Date.now().toString() + '-' + index,
              name: item.name,
              url: item.url,
            }));
          onImportPlaylists(imported);
        } else {
          alert('Invalid JSON format: Expected an array');
        }
      } catch (error) {
        console.error('Import failed', error);
        alert('Failed to parse JSON file');
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const data = playlists.map(({ name, url }) => ({ name, url }));
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'iptvs.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (view === 'channels' && selectedPlaylistId) {
    const currentPlaylist = playlists.find((p) => p.id === selectedPlaylistId);
    return (
      <div
        className="channel-list"
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        <div
          style={{
            padding: '1vh',
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            gap: '1vh',
          }}
        >
          <button
            onClick={() => {
              setView('playlists');
              // Optionally clear selection if needed, but keeping it allows quick return
            }}
            className="icon-btn"
            title="Back to Playlists"
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size="2vh" />
          </button>
          <h3
            style={{
              margin: 0,
              fontSize: '2vh',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentPlaylist?.name || 'Channels'}
          </h3>
        </div>

        <div
          className="channel-scroll-area"
          style={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}
        >
          {channels.length === 0 ? (
            <div style={{ padding: '2vh', textAlign: 'center', color: '#888' }}>
              Loading channels...
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {channels.map((channel) => (
                <li
                  key={channel.id}
                  className={`channel-item ${
                    selectedChannelId === channel.id ? 'selected' : ''
                  }`}
                  onClick={() => onSelectChannel(channel)}
                >
                  <span style={{ flexGrow: 1 }}>{channel.name}</span>
                  {selectedChannelId === channel.id && <Play size="1.4vh" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="channel-list"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '1vh',
      }}
    >
      <div style={{ marginBottom: '1.5vh' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1vh',
          }}
        >
          <h3 style={{ margin: 0 }}>Playlists</h3>
          <div style={{ display: 'flex', gap: '0.5vh' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Import JSON"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                padding: '0.6vh',
                borderRadius: '0.4vh',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Upload size="1.6vh" />
            </button>
            <button
              onClick={handleExport}
              title="Export JSON"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                padding: '0.6vh',
                borderRadius: '0.4vh',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Download size="1.6vh" />
            </button>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5vh',
            marginBottom: '1vh',
          }}
        >
          <input
            type="text"
            placeholder="Playlist Name"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            className="input-field"
          />
          <input
            type="text"
            placeholder="Playlist URL (.m3u)"
            value={newPlaylistUrl}
            onChange={(e) => setNewPlaylistUrl(e.target.value)}
            className="input-field"
          />
          <button
            onClick={handleAdd}
            className="action-btn primary"
            disabled={!newPlaylistName || !newPlaylistUrl}
            style={{
              padding: '1vh',
              fontSize: '1.6vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5vh',
            }}
          >
            <Plus size="1.6vh" style={{ marginRight: '0.5vh' }} /> Add Playlist
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".json"
          onChange={handleImportFile}
        />
      </div>

      <div
        className="channel-scroll-area"
        style={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}
      >
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {playlists.map((playlist) => (
            <li
              key={playlist.id}
              className="channel-item"
              onClick={() => {
                onSelectPlaylist(playlist);
                setView('channels');
              }}
            >
              <span style={{ flexGrow: 1 }}>{playlist.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete playlist "${playlist.name}"?`)) {
                    onDeletePlaylist(playlist.id);
                  }
                }}
                className="delete-btn"
              >
                <Trash2 size="1.4vh" />
              </button>
            </li>
          ))}
        </ul>
        {playlists.length === 0 && (
          <div style={{ textAlign: 'center', color: '#888', marginTop: '2vh' }}>
            No playlists added.
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelList;
