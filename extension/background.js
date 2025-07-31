chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'capture') {
    chrome.tabs.captureVisibleTab(null, {format: 'png'}, (dataUrl) => {
      sendResponse({image: dataUrl});
    });
    return true; // async
  }
});
