import { useEffect, useState } from 'react';
import { Trash2, Plus, ExternalLink } from 'lucide-react';

interface WebSiteConfig {
  id: string;
  name: string;
  urlPattern: string;
  cssSelector: string;
}

const App = () => {
  const [sites, setSites] = useState<WebSiteConfig[]>([]);
  const [newSite, setNewSite] = useState<Partial<WebSiteConfig>>({});
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.sync.get('webTvSites');
      if (result.webTvSites) {
        setSites(result.webTvSites);
      }
    } else {
        const saved = localStorage.getItem('webTvSites');
        if (saved) setSites(JSON.parse(saved));
    }
  };

  const saveSites = async (newSites: WebSiteConfig[]) => {
    setSites(newSites);
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.sync.set({ webTvSites: newSites });
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
  }

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
    const updated = sites.filter(s => s.id !== id);
    await saveSites(updated);
  };

  const handleOpen = (url: string) => {
     let target = url;
     if (!url.startsWith('http')) {
         target = 'https://' + url;
     }
     if (typeof chrome !== 'undefined' && chrome.tabs) {
         chrome.tabs.create({ url: target });
     } else {
         window.open(target, '_blank');
     }
  };

  return (
    <div style={{ padding: '16px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '18px', margin: 0 }}>Web TV Manager</h1>
        <button onClick={() => setActiveTab(activeTab === 'list' ? 'add' : 'list')} style={{ background: 'none', border: 'none', color: '#646cff', cursor: 'pointer' }}>
            {activeTab === 'list' ? <Plus size={20} /> : 'Cancel'}
        </button>
      </header>
      
      {activeTab === 'add' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input 
                placeholder="Name (e.g. YouTube)" 
                value={newSite.name || ''} 
                onChange={e => setNewSite({...newSite, name: e.target.value})} 
            />
            <input 
                placeholder="URL Pattern (e.g. youtube.com)" 
                value={newSite.urlPattern || ''} 
                onChange={e => setNewSite({...newSite, urlPattern: e.target.value})} 
            />
            <div style={{ fontSize: '12px', color: '#888' }}>
              URL supports partial match.
            </div>
            <input 
                placeholder="CSS Selector (e.g. video, .player)" 
                value={newSite.cssSelector || ''} 
                onChange={e => setNewSite({...newSite, cssSelector: e.target.value})} 
            />
            <div style={{ fontSize: '12px', color: '#888' }}>
              This element will be forced to fullscreen.
            </div>
            <button 
                onClick={handleAdd}
                style={{ background: '#646cff', color: 'white', border: 'none', padding: '8px', borderRadius: '4px', marginTop: '8px', cursor: 'pointer' }}
            >
                Add Site
            </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sites.map(site => (
                <div key={site.id} style={{ display: 'flex', alignItems: 'center', background: '#2a2a2a', padding: '8px', borderRadius: '4px', gap: '8px' }}>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 'bold' }}>{site.name}</div>
                        <div style={{ fontSize: '12px', color: '#888', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{site.urlPattern}</div>
                    </div>
                     <button onClick={() => handleOpen(site.urlPattern)} title="Open" style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}>
                        <ExternalLink size={16} />
                    </button>
                    <button onClick={() => handleDelete(site.id)} title="Delete" style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
             {sites.length === 0 && <div style={{ color: '#888', textAlign: 'center', padding: '16px' }}>No sites configured. Click + to add one.</div>}
        </div>
      )}
    </div>
  );
};

export default App;
