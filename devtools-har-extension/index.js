var LOAD_INDICATOR = 'https://did-finish-load/';

chrome.devtools.network.onRequestFinished.addListener(function (request) {
  if (request.request.url === LOAD_INDICATOR) {
    chrome.devtools.network.getHAR(function (har) {
      har.entries = har.entries.filter(function (e) {
        return e.request.url !== LOAD_INDICATOR;
      });
      chrome.devtools.inspectedWindow.eval(`window.__markbot.sendMessageToWindow(window.__markbot.getCurrentTaskWindowId(), "__markbot-hidden-browser-har-generation-succeeded", ${JSON.stringify({log:har})});`);
    });
  }
});

chrome.devtools.inspectedWindow.eval('window.__markbot.sendMessageToWindow(window.__markbot.getCurrentTaskWindowId(), "__markbot-hidden-browser-devtools-loaded");');
