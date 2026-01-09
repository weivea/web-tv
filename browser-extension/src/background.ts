chrome.runtime.onInstalled.addListener(() => {
  console.log('Web TV Helper installed');

  // Enable opening side panel on action click
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.error(error));
  }
});
