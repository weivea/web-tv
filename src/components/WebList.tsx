import React, { useState } from 'react';

interface WebSite {
  id: string;
  name: string;
  url: string;
  cssSelector?: string;
}

interface WebListProps {
  sites: WebSite[];
  selectedSiteId?: string;
  onSelect: (site: WebSite) => void;
  onAdd: (site: WebSite) => void;
  onDelete: (id: string) => void;
}

const WebList: React.FC<WebListProps> = ({
  sites,
  selectedSiteId,
  onSelect,
  onAdd,
  onDelete,
}) => {
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [newCssSelector, setNewCssSelector] = useState('');

  const handleAdd = () => {
    if (!newUrl) return;

    if (newName) {
      onAdd({
        id: Date.now().toString(),
        name: newName,
        url: newUrl,
        cssSelector: newCssSelector,
      });
      setNewName('');
      setNewUrl('');
      setNewCssSelector('');
    } else {
      alert('Please provide a name for the website');
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
        <h3>Web Sites</h3>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Site Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ marginBottom: '5px' }}
          />
          <input
            type="text"
            placeholder="URL (https://...)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            style={{ marginBottom: '5px' }}
          />
          <input
            type="text"
            placeholder="Full Screen CSS Selector (Optional)"
            value={newCssSelector}
            onChange={(e) => setNewCssSelector(e.target.value)}
            style={{ marginBottom: '5px' }}
          />
          <button
            onClick={handleAdd}
            style={{ width: '100%' }}
          >
            Add Website
          </button>
        </div>
      </div>
      <div
        style={{ flexGrow: 1, overflowY: 'auto' }}
        className="channel-scroll-area"
      >
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {sites.map((site) => (
            <li
              key={site.id}
              className={`channel-item ${
                selectedSiteId === site.id ? 'selected' : ''
              }`}
              onClick={() => onSelect(site)}
            >
              <span
                style={{
                  flexGrow: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {site.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(site.id);
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

export default WebList;
