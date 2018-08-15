document.addEventListener(
  "DOMContentLoaded",
  function() {
    var checkPageButton = <HTMLElement>document.getElementById("checkPage");
    checkPageButton.addEventListener(
      "click",
      function() {
        chrome.tabs.getSelected(function(tab) {
          let d = document;

          var f = d.createElement("form");
          f.action = "http://gtmetrix.com/analyze.html?bm";
          f.method = "post";
          let i = <HTMLInputElement>d.createElement("input");
          i.type = "hidden";
          i.name = "url";
          i.value = <string>tab.url;
          f.appendChild(i);
          d.body.appendChild(f);
          f.submit();
        });
      },
      false
    );
  },
  false
);
