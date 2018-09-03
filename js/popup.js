function getDefaultSettings() {
    chrome.storage.sync.get(["mainTitles", "articles"], data => {
        if (data.mainTitles === undefined) {
            chrome.storage.sync.set({ mainTitles: true });
        }
        if (data.articles === undefined) {
            chrome.storage.sync.set({ articles: true });
        }
    });
}
getDefaultSettings();
document.addEventListener("DOMContentLoaded", function () {
    let mainTitlesCheckBox = (document.getElementsByName("mainTitlesCheckBox")[0]);
    let articlesCheckBox = (document.getElementsByName("articlesCheckBox")[0]);
    if (mainTitlesCheckBox === null)
        console.log("mainTitlesCheckBox is null");
    if (articlesCheckBox === null)
        console.log("articlesCheckBox is null");
    let jMainTitlesCheckBox = $(mainTitlesCheckBox);
    let jArticlesCheckBox = $(articlesCheckBox);
    chrome.storage.sync.get(["mainTitles", "articles"], data => {
        jMainTitlesCheckBox.prop("checked", data.mainTitles);
        jArticlesCheckBox.prop("checked", data.articles);
    });
    jMainTitlesCheckBox.on("change", ev => {
        chrome.storage.sync.set({ mainTitles: ev.target.checked });
    });
    jArticlesCheckBox.on("change", ev => {
        chrome.storage.sync.set({ articles: ev.target.checked });
    });
});
