import React from 'react';
import { Minus, Square, X, Bug } from 'lucide-react';
import './TitleBar.css';

const TitleBar: React.FC = () => {
  const handleMinimize = () => {
    window.ipcRenderer.minimizeWindow();
  };

  const handleMaximize = () => {
    window.ipcRenderer.maximizeWindow();
  };

  const handleClose = () => {
    window.ipcRenderer.closeWindow();
  };

  const handleDebug = () => {
    window.ipcRenderer.toggleDevTools();
  };

  return (
    <div className="title-bar">
      <div className="drag-region" />
      <div className="window-controls">
        <button onClick={handleDebug} className="control-btn debug" title="Toggle Developer Tools">
          <Bug size={14} />
        </button>
        <button onClick={handleMinimize} className="control-btn minimize" title="Minimize">
          <Minus size={16} />
        </button>
        <button onClick={handleMaximize} className="control-btn maximize" title="Maximize">
          <Square size={14} />
        </button>
        <button onClick={handleClose} className="control-btn close" title="Close">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
