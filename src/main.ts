let isMainTitlesEnabled = true;
let isArticlesEnabled = true;
let serverUrl = "";
const localUrl = "https://localhost:44320";
const cloudUrl = "https://myynot.azurewebsites.net";
let mtaItemsArticles: Article[] = [];
let isDebug = false;

chrome.storage.sync.get(["mainTitles", "articles"], data => {
  log(`mainTitles is: ${data.mainTitles}`);
  isMainTitlesEnabled = data.mainTitles;

  log(`articles is: ${data.articles}`);
  isArticlesEnabled = data.articles;

  injectScript("disableAutoRefresh.js");
  injectScript("disableAutoPlay.js");
});

class Article {
  title: string;
  subtitle: string;
  amlak: string;
  id: string;
  link: string;
}

enum UrlType {
  Home,
  Article
}

function log(message: string) {
  if (isDebug) console.log(message);
}

function initVariables() {
  if (isDebug) serverUrl = localUrl;
  else serverUrl = cloudUrl;
}

class Helpers {
  static SaveMtaItemAsArticle(element: HTMLElement): Article | undefined {
    let aElement = <HTMLAnchorElement>element.querySelector(".mta_title");

    if (aElement === null) return undefined;

    let title = aElement.innerHTML;

    let linkUrl = aElement.href.substring(
      0,
      aElement.href.lastIndexOf(".html")
    );

    let id = linkUrl.split("/").pop();

    if (title != undefined && id != undefined && linkUrl != undefined) {
      let article = new Article();
      article.id = id;
      article.title = title;
      article.link = linkUrl;

      return article;
    }

    return undefined;
  }

  static ExtractUrl(url: string): UrlType | undefined {
    let splittedUrl = url.split("/").filter(value => value != "");

    if (splittedUrl.length < 3) return undefined;

    if (splittedUrl[2] === "home") {
      return UrlType.Home;
    }

    if (splittedUrl[2] === "articles") {
      return UrlType.Article;
    }

    return undefined;
  }
}

function removeTaboolaAds() {
  log("removing taboola ads");

  let taboolaElements = $("div[id^='taboola'");

  taboolaElements.each((index, element) => {
    let e = $(element);
    e.remove();
  });
}
function removeGoogleArticlePageAds() {
  let ins = $("ins.adsbygoogle");
  if (ins != null) ins.remove();

  let bluelink = $("a.bluelink");
  if (bluelink != null) {
    let blueLinkParent = bluelink.parent("p");
    if (blueLinkParent != null) blueLinkParent.remove();
  }

  let googleElements = $("div[id^='google'");

  googleElements.each((index, element) => {
    let e = $(element);
    let parent = e.parent();

    if (parent != null) parent.remove();
  });
}

function removeGoogleGlobalAds() {
  let frame = document.getElementById("ads.mivzakon");
  if (frame != null) frame.parentNode.removeChild(frame);

  frame = document.getElementById("ads.top");
  if (frame != null) frame.parentNode.removeChild(frame);

  frame = document.getElementById("ads.ozen.right");
  if (frame != null) frame.parentNode.removeChild(frame);
}
function removeBanners() {
  // remove google ads
  removeGoogleGlobalAds();

  let element = $('div[data-tb-region*="News"]').first();
  let p = element.parentsUntil("div.block.B6").last();
  let p6 = p.parent();
  let p6Closest = p6.prev("div.block.B6");

  if (p6Closest != undefined) p6Closest.remove();
}

$(document).ready(() => {
  initVariables();

  let pageType = Helpers.ExtractUrl(document.URL);

  if (pageType === UrlType.Home) {
    $.get({
      url: `${serverUrl}/api/articles`,
      dataType: "json",
      success: data => {
        extractHomePage(data);
      }
    });
  } else if (pageType === UrlType.Article) {
    log("Send Amlak");

    let article = extractArticle();

    let linkUrl = document.URL.substring(0, document.URL.lastIndexOf(".html"));

    log("linkUrl = " + linkUrl);

    article.id = linkUrl.split("/").pop();

    log("id = " + article.id);

    let baseUrl = `${serverUrl}/api/articles`;

    $.post(baseUrl, article);

    removeGoogleGlobalAds();
    removeGoogleArticlePageAds();
    removeTaboolaAds();
  }
});

function extractHomePage(data: Array<Article>) {
  mtaItemsArticles = data;

  log("extracting home page");

  if (isMainTitlesEnabled) extractMainTitles();
  removeBanners();
  if (isArticlesEnabled) extractContentWrap();
}

function injectScript(filename: string) {
  log(`injecting script ${filename}`);

  var s = document.createElement("script");
  s.src = chrome.extension.getURL(filename);
  s.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(s);
}
function extractMainTitles() {
  log("extracting main titles");

  let rootDiv = $(
    ".str3s_small.str3s_type_small, .str3s_small.str3s_type_small > .cell, .str3s_small.str3s_type_small > .cell > a, .str3s_small.str3s_type_small > .cell > .str3s_img > img"
  );

  let parentDiv = rootDiv.first().closest("div.block.B3");
  let adsDiv = removeRightTitleAds(parentDiv.closest("div.block.B6"));
  adsDiv.empty();

  let parentDivCloned = parentDiv.clone(true);
  parentDiv.empty();

  let homePageMiniTitles = parentDivCloned
    .find("div.homepageministrip.hpstrip_new")
    .parent("div.element.B3.ghcite.noBottomPadding");

  parentDivCloned.children().each((index, element) => {
    let div = $(element);

    log(`title number: ${index}`);

    let divChildClass = div.find(":first-child").attr("class");

    if (divChildClass != "str3s str3s_small str3s_type_small") return;

    let divClone = div.clone(true);

    let e = buildTitle(divClone);

    let selectedDiv = parentDiv;

    if (index % 2 != 0) selectedDiv = adsDiv;

    if (e != undefined) selectedDiv.append(e);
    else selectedDiv.append(divClone);

    selectedDiv.append(homePageMiniTitles);
    log("------------------");
  });

  adjustTitlesHeight(parentDiv, adsDiv);

  adsDiv.append(homePageMiniTitles);
}

function adjustTitlesHeight(
  leftDiv: JQuery<HTMLElement>,
  rightDiv: JQuery<HTMLElement>
) {
  log("adjust titles heights");

  leftDiv.children().each((index, element) => {
    let leftTitle = $(element);
    let leftHeight = leftTitle.height();

    let rightTitle = $(rightDiv.children().get(index));
    if (rightTitle == undefined) return;

    let rightHeight = $(rightTitle).height();

    log(`${leftHeight}px : ${rightHeight}px`);

    if (leftHeight === rightHeight) return;

    let height = Math.max(leftHeight, rightHeight);
    leftTitle.height(height);
    rightTitle.height(height);
  });
}

function removeRightTitleAds(rootDiv: JQuery<HTMLElement>) {
  log(`B6 block found: ${rootDiv.attr("class")}`);

  rootDiv.css("width", "1000px");
  let adsDiv = rootDiv.find("div.block.B1.spacer");
  adsDiv.empty();

  adsDiv = rootDiv.find("div.block.B2b.spacer");

  log(`ads div found ${adsDiv.attr("class")}`);
  adsDiv.empty();
  adsDiv.removeClass();
  adsDiv.addClass("block B3 spacer");
  adsDiv.css("margin-left", "20px");

  return adsDiv;
}

function buildTitle(rootDiv: JQuery<HTMLElement>): JQuery.Node[] | undefined {
  rootDiv.removeClass();

  let background = rootDiv
    .find("div.str3s.str3s_small.str3s_type_small")
    .css("background");

  let a = rootDiv.find("a.str3s_img");
  let linkUrl = a.attr("href");
  log("linkUrl: " + linkUrl);

  if (linkUrl === undefined) return;

  let id = linkUrl
    .substring(0, linkUrl.lastIndexOf(".html"))
    .split("/")
    .pop();
  log("id: " + id);

  let imgLink = a.find("img").attr("src");

  let article = mtaItemsArticles.filter(value => value.id === id)[0];

  log(`article found for id: ${id}`);

  let titleDiv = rootDiv.find("div.title");
  let title = titleDiv.text();

  let subtitleDiv = rootDiv.find("div.sub_title");
  let amlak = subtitleDiv.text();

  if (article != undefined) amlak = article.amlak;

  let addon: HTMLElement;
  a.children().each((index, element) => {
    if (index === 0) {
      addon = element;
      addon.style.height = "29px";
      addon.style.width = "29px";
      addon.style.zIndex = "999";
      addon.style.position = "absolute";
    }
  });

  let e = $.parseHTML(
    `<div style="clear: both;background: ${background};margin-bottom: 16px;min-height: 118px">
        <div class="cell cshort layout1" style="margin-right: 3px"><a class="str3s_img" href="${linkUrl} style="float:right">
        <div style="float:right;display=block;position:relative">
        <div style="position:absolute;bottom:3px;left:3px;z-index:999;width:29px;height:29px;background:url('/images/small_play_new.png') no-repeat"></div>
        <img style="float:right;overflow:auto;clear:both;margin-top: 20px;max-height:88px;max-width:155px" src="${imgLink}">
        </div>
        </a>
        </div>
       
  
        <div class="str3s_txt">
        <div class="title" style="direction:rtl;margin-top: 16px;margin-right: -10px;text-align: right;color:#FFFFFF;line-height:22px"><a href="${linkUrl}" style="text-decoration:none;color: #FFFFFF">${title}</a></div>
        <div class="sub_title sub_title_no_credit" style="margin: 3px 10px 16px 10px; text-align: right;color:#FFFFFF;line-height:17px">
        <a href="${linkUrl}" style="text-decoration:none;color: #FFFFFF">${amlak}</a></div>
        </div>`
  );

  return e;
}

function extractArticle(): Article {
  let article = new Article();

  let titleElement = $(".art_header_title").get(0);

  article.subtitle = titleElement.innerHTML;

  let amlakElement = $(".art_header_sub_title").get(0);

  article.amlak = amlakElement.innerHTML;

  return article;
}

function extractContentWrap() {
  let rootUl = $(
    ".multiarticles.mta_4 > .content_wrap > .mta_pic_items, .multiarticles.mta_3 > .content_wrap > .mta_pic_items"
  );

  rootUl.each((index, element) => {
    let ul = $(element);
    let div = ul.parent();

    let ulMtaItems = div.find("ul.mta_items").clone(true);
    ulMtaItems.css("clear", "both");
    ulMtaItems.css("padding-top", "10px");

    div.empty();

    buildMTAPicDiv(ul, div);
    BuildMTAItems(ulMtaItems);

    div.append(ulMtaItems);
  });

  adjustHeights();
}

function buildMTAPicDiv(ul: JQuery<HTMLElement>, div: JQuery<HTMLElement>) {
  let linkUrl = ul.find("a.mta_pic_link").attr("href");
  log("linkUrl: " + linkUrl);

  if (linkUrl === undefined) return;

  let id = linkUrl
    .substring(0, linkUrl.lastIndexOf(".html"))
    .split("/")
    .pop();
  log("id: " + id);

  let imgLink = ul.find("img.mta_pic").attr("src");
  log("imgLink: " + imgLink);

  let title = ul.find("a.mta_title").text();
  log("title: " + title);

  let article = mtaItemsArticles.filter(value => value.id === id)[0];

  let amlak = "";
  if (article != undefined) amlak = article.amlak;

  let e = $.parseHTML(
    `<div style="clear: both">
        <div ><a href="${linkUrl}"><img style="float:right;overflow:auto;clear:both;max-height:88px;max-width:155px" src="${imgLink}"></a>
        </div>
       
  
        <div class="str3s_txt">
        <div class="title" style="margin-right: 10px"><a href="${linkUrl}" style="text-decoration:none;color: #000000">${title}</a></div>
        <div style="margin-right: 10px"><a href="${linkUrl}" style="text-decoration:none;color: #000000">${amlak}</a></div>
        
        </div>`
  );

  div.append(e);
}

function BuildMTAItems(ul: JQuery<HTMLElement>) {
  let li = ul.find("li");

  li.each((index, element) => {
    let article = Helpers.SaveMtaItemAsArticle(element);

    if (article === undefined) return;

    let result = mtaItemsArticles.filter(value => value.id === article!.id);

    if (result.length != 1) return;

    let amlak = result[0];

    if (article != undefined) {
      let amlakDiv = `<div class="mta_gray_text" style="color:#000000">${
        amlak.amlak
      }</div>`;

      let title = $(element)
        .children()
        .get(0);

      let authorDiv = $(
        $(element)
          .children()
          .get(1)
      ).clone(true);

      $(element).empty();

      $(element).append(title);
      $(element).append(amlakDiv);
      $(element).append(authorDiv);
    }
  });
}

function adjustHeights() {
  log("### Adjust Heights");
  $("div.block.B6").each((index, element) => {
    let divs = $(element).find("div.content_wrap");

    let heights: number[] = [];
    if (divs.length === 2) {
      divs.each((index, element) => {
        heights.push($(element).height());
        // let height = $(element).attr("height");
        // log("height found: " + height);
      });

      let maxHeight = Math.max(...heights);

      log("max height found: " + maxHeight);

      divs.each((index, element) => {
        if ($(element).height() != maxHeight) {
          $(element).height(maxHeight);
        }
      });
    }
    // log("Number of content_wrap divs: " + div.length);
    //log($(element).attr("class"));

    //log("content_wraps found: " + divs.length);
  });
}
