import { useEffect, useState, useRef } from 'react';
import { Trash2, Plus, Upload, Download } from 'lucide-react';

interface WebSiteConfig {
  id: string;
  name: string;
  urlPattern: string;
  cssSelector: string;
  url?: string;
}

const App = () => {
  const [sites, setSites] = useState<WebSiteConfig[]>([]);
  const [newSite, setNewSite] = useState<Partial<WebSiteConfig>>({});
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(['webTvSites', 'webTvChannelId']);
      if (result.webTvSites) {
        setSites(result.webTvSites);
      }
      if (result.webTvChannelId) {
        setActiveChannelId(result.webTvChannelId);
      }
    } else {
      const saved = localStorage.getItem('webTvSites');
      if (saved) setSites(JSON.parse(saved));
      const savedId = localStorage.getItem('webTvChannelId');
      if (savedId) setActiveChannelId(savedId);
    }
  };

  const saveSites = async (newSites: WebSiteConfig[]) => {
    setSites(newSites);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ webTvSites: newSites });
    } else {
      localStorage.setItem('webTvSites', JSON.stringify(newSites));
    }
  };

  const calculateId = (url: string) => {
    try {
      return btoa(url).replace(/=/g, '').substring(0, 10);
    } catch {
      return Math.random().toString(36).substring(7);
    }
  };

  const handleAdd = async () => {
    if (!newSite.name || !newSite.urlPattern) return;

    const id = calculateId(newSite.urlPattern);

    const site: WebSiteConfig = {
      id: id,
      name: newSite.name,
      urlPattern: newSite.urlPattern,
      cssSelector: newSite.cssSelector || '',
    };

    const updated = [...sites, site];
    await saveSites(updated);
    setNewSite({});
    setActiveTab('list');
  };

  const handleDelete = async (id: string) => {
    const updated = sites.filter((s) => s.id !== id);
    await saveSites(updated);
  };

  const handleOpen = async (siteConfig: WebSiteConfig) => {
    let target = siteConfig.urlPattern;
    if (!target.startsWith('http')) {
      target = 'https://' + target;
    }
    
    // Update active state
    setActiveChannelId(siteConfig.id);
    if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ webTvChannelId: siteConfig.id });
    } else {
        localStorage.setItem('webTvChannelId', siteConfig.id);
    }

    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.storage) {
      try {
        const result = await chrome.storage.local.get('webTvTabId');
        const existingTabId = result.webTvTabId;

        if (existingTabId) {
          try {
            await chrome.tabs.get(existingTabId);
            await chrome.tabs.update(existingTabId, { url: target, active: true });
            // Attempt to focus the window as well
            const tab = await chrome.tabs.get(existingTabId);
            if (tab.windowId) {
                await chrome.windows.update(tab.windowId, { focused: true });
            }
            return;
          } catch (e) {
            // Tab no longer exists, create new one
          }
        }
        
        const tab = await chrome.tabs.create({ url: target });
        if (tab.id) {
          await chrome.storage.local.set({ webTvTabId: tab.id });
        }
      } catch (error) {
        console.error('Failed to open tab', error);
      }
    } else {
      window.open(target, 'web-tv-player');
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(sites, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'web-tv-sites.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const imported = JSON.parse(content);
        if (Array.isArray(imported)) {
          // Normalize imported data to match extension format if needed
          // Electron app used "url", extension uses "urlPattern". We support both.
          const normalized = imported.map(
            (s: Partial<WebSiteConfig> & { url?: string }) => ({
              id: s.id || calculateId(s.url || s.urlPattern || ''),
              name: s.name || 'Unnamed',
              urlPattern: s.urlPattern || s.url || '',
              cssSelector: s.cssSelector || '',
            }),
          );

          // Merge: filter out existing by ID or URL
          const existingIds = new Set(sites.map((s) => s.id));
          const existingUrls = new Set(sites.map((s) => s.urlPattern));

          const toAdd = normalized.filter(
            (s: WebSiteConfig) =>
              !existingIds.has(s.id) && !existingUrls.has(s.urlPattern),
          );

          if (toAdd.length > 0) {
            const newSites = [...sites, ...toAdd];
            await saveSites(newSites);
            alert(`Imported ${toAdd.length} sites.`);
          } else {
            alert('No new sites found in file.');
          }
        }
      } catch (err) {
        console.error('Import failed', err);
        alert('Failed to import file. Invalid JSON.');
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <header className="header">
        <h1>Web TV Manager</h1>
        <div className="icon-btn-group">
          {activeTab === 'list' && (
            <>
              <button onClick={handleImportClick} title="Import JSON">
                <Upload size={16} />
              </button>
              <button onClick={handleExport} title="Export JSON">
                <Download size={16} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json"
                style={{ display: 'none' }}
              />
            </>
          )}
          <button
            onClick={() => setActiveTab(activeTab === 'list' ? 'add' : 'list')}
            title={activeTab === 'list' ? 'Add Site' : 'Cancel'}
          >
            {activeTab === 'list' ? <Plus size={18} /> : 'Cancel'}
          </button>
        </div>
      </header>

      {activeTab === 'add' ? (
        <div className="add-form">
          <input
            type="text"
            placeholder="Name (e.g. YouTube)"
            value={newSite.name || ''}
            onChange={(e) => setNewSite({ ...newSite, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="URL Pattern (e.g. youtube.com)"
            value={newSite.urlPattern || ''}
            onChange={(e) =>
              setNewSite({ ...newSite, urlPattern: e.target.value })
            }
          />
          <div className="helper-text">URL supports partial match.</div>
          <input
            type="text"
            placeholder="CSS Selector (e.g. video, .player)"
            value={newSite.cssSelector || ''}
            onChange={(e) =>
              setNewSite({ ...newSite, cssSelector: e.target.value })
            }
          />
          <div className="helper-text">
            This element will be forced to fullscreen.
          </div>
          <button onClick={handleAdd} className="primary-btn">
            Add Site
          </button>
        </div>
      ) : (
        <div className="channel-list">
          {sites.map((site) => (
            <div
              key={site.id}
              onClick={() => handleOpen(site)}
              className={`channel-item ${site.id === activeChannelId ? 'selected' : ''}`}
            >
              <div className="channel-info">
                <div className="channel-name">{site.name}</div>
                <div className="channel-url">
                  {site.urlPattern}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(site.id);
                }}
                className="icon-btn delete-btn"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {sites.length === 0 && (
            <div className="empty-state">
              No sites configured. Click + to add one.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
