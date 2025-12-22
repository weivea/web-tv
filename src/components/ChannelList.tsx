import React, { useState } from 'react';
import { parseM3U } from '../utils/m3uParser';

interface Channel {
  id: string;
  name: string;
  url: string;
}

interface ChannelListProps {
  channels: Channel[];
  selectedChannelId?: string;
  onSelect: (channel: Channel) => void;
  onAdd: (channel: Channel) => void;
  onImport: (channels: Channel[]) => void;
  onDelete: (id: string) => void;
}

const ChannelList: React.FC<ChannelListProps> = ({
  channels,
  selectedChannelId,
  onSelect,
  onAdd,
  onImport,
  onDelete,
}) => {
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleAdd = async () => {
    if (!newUrl) return;

    // Check if it might be a playlist
    if (newUrl.endsWith('.m3u') || newUrl.endsWith('.m3u8')) {
      // Try to fetch and see if it's a playlist
      try {
        setIsImporting(true);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

        try {
          const response = await fetch(newUrl, { signal: controller.signal });
          clearTimeout(timeoutId);
          const text = await response.text();

          if (text.includes('#EXTM3U')) {
            const parsedChannels = parseM3U(text);
            const channelsToAdd = parsedChannels.map((c, index) => ({
              id: Date.now().toString() + '-' + index,
              name: c.name,
              url: c.url,
            }));

            if (channelsToAdd.length > 0) {
              onImport(channelsToAdd);
              setNewUrl('');
              setNewName('');
              setIsImporting(false);
              return;
            }
          }
        } catch (fetchError) {
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            alert('Import timed out after 15 seconds');
          } else {
            throw fetchError;
          }
        }
      } catch (error) {
        console.error('Failed to import playlist', error);
      } finally {
        setIsImporting(false);
      }
    }

    if (newName) {
      onAdd({
        id: Date.now().toString(),
        name: newName,
        url: newUrl,
      });
      setNewName('');
      setNewUrl('');
    } else {
      // If no name provided but url is there, use url as name or ask for name
      // For now, let's require name for single channel
      alert('Please provide a name for the channel');
    }
  };

  return (
    <div
      className="channel-list"
      style={{
        padding: '10px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flexShrink: 0 }}>
        <h3>Channels</h3>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Name (Optional for Playlist)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ marginBottom: '5px' }}
          />
          <input
            type="text"
            placeholder="M3U8 URL"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            style={{ marginBottom: '5px' }}
          />
          <button
            onClick={handleAdd}
            style={{ width: '100%' }}
            disabled={isImporting}
          >
            {isImporting ? 'Importing...' : 'Add / Import URL'}
          </button>
        </div>
      </div>
      <div
        style={{ flexGrow: 1, overflowY: 'auto' }}
        className="channel-scroll-area"
      >
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {channels.map((channel) => (
            <li
              key={channel.id}
              className={`channel-item ${
                selectedChannelId === channel.id ? 'selected' : ''
              }`}
              onClick={() => onSelect(channel)}
            >
              <span
                style={{
                  flexGrow: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {channel.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(channel.id);
                }}
                className="delete-btn"
              >
                X
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ChannelList;
