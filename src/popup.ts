document.addEventListener("DOMContentLoaded", function() {
  let mainTitlesCheckBox = <HTMLInputElement>(
    document.getElementsByName("mainTitlesCheckBox")[0]
  );

  let articlesCheckBox = <HTMLInputElement>(
    document.getElementsByName("articlesCheckBox")[0]
  );

  if (mainTitlesCheckBox === null) console.log("mainTitlesCheckBox is null");
  if (articlesCheckBox === null) console.log("articlesCheckBox is null");

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
