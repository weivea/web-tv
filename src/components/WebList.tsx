import React, { useState } from 'react';
import { Upload, Download } from 'lucide-react';

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
  onImport: (sites: WebSite[]) => void;
  onDelete: (id: string) => void;
  onReorder: (sites: WebSite[]) => void;
}

const WebList: React.FC<WebListProps> = ({
  sites,
  selectedSiteId,
  onSelect,
  onAdd,
  onImport,
  onDelete,
  onReorder,
}) => {
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [newCssSelector, setNewCssSelector] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    if (draggedIndex === dropIndex) return;

    const newSites = [...sites];
    const [draggedItem] = newSites.splice(draggedIndex, 1);
    newSites.splice(dropIndex, 0, draggedItem);

    onReorder(newSites);
    setDraggedIndex(null);
  };

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

  const handleExport = () => {
    // Exclude id from export
    const sitesToExport = sites.map(({ id, ...rest }) => rest);
    const dataStr = JSON.stringify(sitesToExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'web-tv-sites.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const importedSites = JSON.parse(content);
        if (Array.isArray(importedSites)) {
          // Basic validation
          const validSites = importedSites
            .filter((s) => s.name && s.url)
            .map((s, index) => ({
              ...s,
              id: s.id || `${Date.now()}-${index}`,
            }));
          onImport(validSites);
        } else {
          alert('Invalid JSON format: Expected an array of sites.');
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
        alert('Error parsing JSON file.');
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be selected again
    e.target.value = '';
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <h3 style={{ margin: 0 }}>Web Sites</h3>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              onClick={handleImportClick}
              title="Import JSON"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                padding: '6px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Upload size={16} />
            </button>
            <button
              onClick={handleExport}
              title="Export JSON"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                padding: '6px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Download size={16} />
            </button>
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".json"
          onChange={handleFileChange}
        />
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
          <button onClick={handleAdd} style={{ width: '100%' }}>
            Add Website
          </button>
        </div>
      </div>
      <div
        style={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}
        className="channel-scroll-area"
      >
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {sites.map((site, index) => (
            <li
              key={site.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
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
