let isMainTitlesEnabled = true;
let isArticlesEnabled = true;
let serverUrl = "";
const localUrl = "https://localhost:44320";
const cloudUrl = "https://myynot.azurewebsites.net";
let mtaItemsArticles: Article[] = [];
let isDebug = true;

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

class AdsHelper {
  static removeTaboolaAds() {
    log("removing taboola ads");

    $("div[id*='taboola'").remove();
  }

  static removeGoogleAds() {
    log("removing google ads");

    $("div[id^='ads'").remove();
    $("*[class*='google'").remove();
    $("div[id^='google'").remove();
  }

  static removeArticlePageAds() {
    AdsHelper.removeGoogleAds();
    AdsHelper.removeTaboolaAds();

    let bluelink = $("a.bluelink");
    if (bluelink != null) {
      let blueLinkParent = bluelink.parent("p");
      if (blueLinkParent != null) blueLinkParent.remove();
    }
  }
  static removeHomePageAds() {
    // remove google ads
    AdsHelper.removeGoogleAds();
    AdsHelper.removeTaboolaAds();

    let element = $('div[data-tb-region*="News"]').first();
    let p = element.parentsUntil("div.block.B6").last();
    let p6 = p.parent();
    let p6Closest = p6.prev("div.block.B6");

    if (p6Closest != undefined) p6Closest.remove();
  }
}

$(document).ready(() => {
  initVariables();

  let pageType = Helpers.ExtractUrl(document.URL);

  log(`getting data from ${serverUrl}`);
  if (pageType === UrlType.Home) {
    $.get({
      url: `${serverUrl}/api/articles`,
      dataType: "json",
      success: data => {
        extractHomePage(data);
      }
    });
  } else if (pageType === UrlType.Article) {
    extractArticlePage();
  }
});

function extractHomePage(data: Array<Article>) {
  mtaItemsArticles = data;

  log("extracting home page.");

  AdsHelper.removeHomePageAds();
  if (isMainTitlesEnabled) extractMainTitles();
  if (isArticlesEnabled) extractContentWrap();
}

function extractArticlePage() {
  AdsHelper.removeArticlePageAds();

  log("extracting article page.");

  let article = extractArticle();

  let linkUrl = document.URL.substring(0, document.URL.lastIndexOf(".html"));

  log("linkUrl = " + linkUrl);

  article.id = linkUrl.split("/").pop();

  log("id = " + article.id);

  let baseUrl = `${serverUrl}/api/articles`;

  log(`posting to ${baseUrl} article ${article}`);

  $.post(baseUrl, article);
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

  let rootDiv = $("article > div.block.B6").first();
  let articlesDiv = rootDiv.children("div.block.B6").eq(2);
  let leftPanelDiv = articlesDiv.children("div.block.B3").first();
  let leftPanelArticlesDiv = leftPanelDiv.children("div.block.B3").first();
  let leftPanelMiniArticlesDiv = leftPanelArticlesDiv.children().last();

  articlesDiv.css("width", "1000px");

  // clear right panel
  articlesDiv.find("div.block.B1.spacer").remove();
  articlesDiv.find("div.block.B2b.spacer").remove();

  // add right panel div
  let rightPanelArticlesDiv = $(
    `<div class="block B3 spacer" style="margin-left: 20px">`
  );
  articlesDiv.append(rightPanelArticlesDiv);

  let leftPanelArticlesDivCloned = leftPanelArticlesDiv.clone(true);
  leftPanelArticlesDiv.empty();

  leftPanelArticlesDivCloned.children().each((index, element) => {
    let div = $(element);

    log(`title number: ${index}`);

    let divChildClass = div.find(":first-child").attr("class");

    if (divChildClass != "str3s str3s_small str3s_type_small") return;

    if (index % 2 == 0) leftPanelArticlesDiv.append(buildTitle(div));
    else rightPanelArticlesDiv.append(buildTitle(div));

    log("------------------");
  });

  rightPanelArticlesDiv.append(leftPanelMiniArticlesDiv);

  adjustTitlesHeight(leftPanelArticlesDiv, rightPanelArticlesDiv);
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

function buildTitle(
  rootDiv: JQuery<HTMLElement>
): JQuery<HTMLElement> | undefined {
  log("building title");
  //rootDiv.removeClass();

  let background = rootDiv
    .find("div.str3s.str3s_small.str3s_type_small")
    .css("background");

  let a = rootDiv.find("a.str3s_img");
  let linkUrl = a.attr("href");
  let id = linkUrl
    .substring(0, linkUrl.lastIndexOf(".html"))
    .split("/")
    .pop();
  log("id: " + id);

  let imgLink = a.find("img").attr("src");

  log(`searching for ${id} in ${mtaItemsArticles.length} articles`);
  let article = mtaItemsArticles.filter(value => value.id === id)[0];

  if (article != null) {
    log(`article found for id: ${id}`);
    log(`articla amlak: ${article.amlak}`);
  } else {
    log(`article not found for ${id}`);
  }

  let title = rootDiv.find("div.title").text();
  let amlak = rootDiv.find("div.sub_title").text();

  if (article != undefined) {
    log(`setting amlak: ${article.amlak}`);
    amlak = article.amlak;
  }

  return $(`<div style="clear: both;background: ${background};margin-bottom: 16px;min-height: 118px">
        <div class="cell cshort layout1" style="margin-right: 3px"><a class="str3s_img" href="${linkUrl} style="float:right">
        <div style="float:right;display=block;position:relative">
        <div style="position:absolute;bottom:3px;left:3px;z-index:999;width:29px;height:29px;background:url('/images/small_play_new.png') no-repeat"></div>
        <img style="float:right;overflow:auto;clear:both;margin-top: 20px;max-height:88px;max-width:155px" src="${imgLink}">
        </div>
        </a>
        </div>
       
  
        <div class="str3s_txt">
        <div class="title" style="direction:rtl;margin-top: 16px;margin-right: -10px;text-align: right;color:#FFFFFF;line-height:22px"><a href="${linkUrl}" style="text-decoration:none;color: #FFFFFF">${title}</a></div>
        <div class="sub_title sub_title_no_credit" style="margin: 3px 10px 16px 10px; text-align: right;color:#FFFFFF;line-height:17px;direction:rtl">
        <a href="${linkUrl}" style="text-decoration:none;color: #FFFFFF">${amlak}</a></div>
        </div>`);
}

function extractArticle(): Article {
  let article = new Article();

  article.subtitle = $("div.art_header_title")
    .first()
    .text();

  article.amlak = $("div.art_header_sub_title")
    .first()
    .text();

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
  let subtitle = "";
  if (article != undefined) {
    amlak = article.amlak;
    subtitle = extractSubtitle(article.subtitle, title);
  }

  let e = $.parseHTML(
    `<div style="clear: both">
        <div ><a href="${linkUrl}"><img style="float:right;overflow:auto;clear:both;max-height:88px;max-width:155px" src="${imgLink}"></a>
        </div>
       
  
        <div class="str3s_txt">
        <div class="title" style="margin-right: 10px"><a href="${linkUrl}" style="text-decoration:none;color: #000000">${title}</a></div>
        <div style="margin-right: 10px"><a href="${linkUrl}" style="text-decoration:none;color: #000000">${subtitle}${amlak}</a></div>
        
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
      let subtitle = extractSubtitle(amlak.subtitle, article.title);

      let amlakDiv = `<div class="mta_gray_text" style="color:#000000">${subtitle}${
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

function extractSubtitle(subtitle: string, title: string): string {
  log(`extractSubtitle: title: ${title}, subtitle: ${subtitle}`);
  let pattern = /[?|!|"|,]+/g;
  let s = subtitle.replace(pattern, "");
  let t = title.replace(pattern, "");
  log(s);
  log(t);

  if (s.trim().localeCompare(t.trim()) == 0) {
    log("strings equal.");
    subtitle = "";
  } else if (t.trim().includes(s.trim())) {
    subtitle = "";
  } else if (s.split(":").length > 1 && t.split(":").length > 1) {
    log(`includes ":"`);
    let s1 = s.split(":")[0];
    let t1 = t.split(":")[0];
    let s2 = s.split(":")[1];

    log(s1);
    log(t1);
    if (s1.localeCompare(t1) == 0) {
      subtitle = `<b>${s2}</b>.`;
    } else {
      subtitle = `<b>${subtitle}</b>. `;
    }
  } else {
    subtitle = `<b>${subtitle}</b>. `;
  }

  return subtitle;
}

function adjustHeights() {
  log("### Adjust Heights");
  let divs = $(".multiarticles > .content_wrap");

  let heights: number[] = [];
  $(".multiarticles > .content_wrap").each((index, element) => {
    heights.push($(element).height());
  });

  let maxHeight = Math.max(heights[0], heights[1]);
  $(divs[0]).height(maxHeight);
  $(divs[1]).height(maxHeight);

  maxHeight = Math.max(heights[2], heights[3]);
  $(divs[2]).height(maxHeight);
  $(divs[3]).height(maxHeight);

  maxHeight = Math.max(heights[4], heights[6]);
  $(divs[4]).height(maxHeight);
  $(divs[6]).height(maxHeight);

  maxHeight = Math.max(heights[5], heights[7]);
  $(divs[5]).height(maxHeight);
  $(divs[7]).height(maxHeight);
}
