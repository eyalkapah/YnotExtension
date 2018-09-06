chrome.runtime.onInstalled.addListener(details => {
    if (details.reason === "install") {
        chrome.storage.sync.set({ mainTitles: true });
        chrome.storage.sync.set({ articles: true });
    }
    if (details.reason === "update") {
    }
});
