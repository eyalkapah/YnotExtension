let mtaItemsArticles: Article[] = [];

class Article {
  title: string;
  subtitle: string;
  amlak: string;
  id: string;
  link: string;
  region: string;
  imgLink: string;
}

enum UrlType {
  Home,
  Article
}

class Helpers {
  static ExtractStr3s(element: HTMLElement): Article | undefined {
    let titleElement = element.querySelector(".title");

    if (titleElement === null) return undefined;

    let title = titleElement.innerHTML;

    var subTitleElement = element.querySelector(".sub_title");

    if (subTitleElement === null) return undefined;

    let subtitle = subTitleElement.innerHTML;

    let linkParent = element.closest("a");

    if (linkParent != null) {
      let linkUrl = linkParent.href.substring(
        0,
        linkParent.href.lastIndexOf(".html")
      );

      let id = linkUrl.split("/").pop();

      if (
        title != undefined &&
        id != undefined &&
        linkUrl != undefined &&
        subtitle != null
      ) {
        let article = new Article();
        article.id = id;
        article.title = title;
        article.link = linkUrl;
        article.subtitle = subtitle;

        return article;
      }
    }

    return undefined;
  }

  static SaveMtaItemAsArticle(element: HTMLElement): Article | undefined {
    let aElement = <HTMLAnchorElement>element.querySelector(".mta_title");

    if (aElement === null) return undefined;

    // if ($(element).children().length > 0) return undefined;

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

function removeBanners() {
  let element = $('div[data-tb-region*="News"]').first();
  let p = element.parentsUntil("div.block.B6").last();
  let p6 = p.parent();
  let p6Closest = p6.prev("div.block.B6");

  if (p6Closest != undefined) p6Closest.remove();
}

$(document).ready(() => {
  let pageType = Helpers.ExtractUrl(document.URL);

  if (pageType === UrlType.Home) {
    $.get({
      url: "https://localhost:44320/api/articles",
      dataType: "json",
      success: data => {
        extractHomePage(data);
      }
    });
  } else if (pageType === UrlType.Article) {
    console.log("Send Amlak");

    let article = extractArticle();

    let linkUrl = document.URL.substring(0, document.URL.lastIndexOf(".html"));

    console.log("linkUrl = " + linkUrl);

    article.id = linkUrl.split("/").pop();

    console.log("id = " + article.id);

    let baseUrl = "https://localhost:44320/api/articles";

    $.post(baseUrl, article);
    // send amlak to server
  }
});

function extractHomePage(data: Array<Article>) {
  mtaItemsArticles = data;

  console.log("extracting home page");
  extractMainTitles();
  removeBanners();
  extractContentWrap();
  adjustHeights();
}

function extractMainTitles() {
  console.log("extracting main titles");

  let rootDiv = $(
    ".str3s_small.str3s_type_small, .str3s_small.str3s_type_small > .cell, .str3s_small.str3s_type_small > .cell > a, .str3s_small.str3s_type_small > .cell > .str3s_img > img"
  );

  console.log("total number of rootDivs found: " + rootDiv.length);

  let parentDiv = rootDiv.first().closest("div.block.B3");

  console.log(
    `number of parent div for "${parentDiv.attr("class")}": ${parentDiv.length}`
  );

  let parentDivCloned = parentDiv.clone(true);
  parentDiv.empty();

  let clones: HTMLElement[] = [];
  parentDivCloned.children().each((index, element) => {
    let div = $(element);

    console.log(`title number: ${index}`);

    let divChildClass = div.find(":first-child").attr("class");

    console.log(`title div element name: ${divChildClass}`);

    if (divChildClass != "str3s str3s_small str3s_type_small") return;

    // console.log("number of titles div found: " + parentDiv.length);

    let divClone = div.clone(true);

    let e = buildTitle(divClone);

    if (e != undefined) parentDiv.append(e);
    else parentDiv.append(divClone);

    console.log("------------------");
  });
}

function buildTitle(rootDiv: JQuery<HTMLElement>): JQuery.Node[] | undefined {
  rootDiv.removeClass();

  let background = rootDiv
    .find("div.str3s.str3s_small.str3s_type_small")
    .css("background");
  console.log(`background found: ${background}`);

  let a = rootDiv.find("a.str3s_img");
  let linkUrl = a.attr("href");
  console.log("linkUrl: " + linkUrl);

  if (linkUrl === undefined) return;

  let id = linkUrl
    .substring(0, linkUrl.lastIndexOf(".html"))
    .split("/")
    .pop();
  console.log("id: " + id);

  let imgLink = a.find("img").attr("src");

  let article = mtaItemsArticles.filter(value => value.id === id)[0];

  if (article === undefined) return;

  console.log(`article found for id: ${id}`);

  let titleDiv = rootDiv.find("div.title");
  let title = titleDiv.text();

  let e = $.parseHTML(
    `<div style="clear: both;background: ${background};margin-bottom: 16px;min-height: 118px">
        <div style="margin-right: 3px"><a href="${linkUrl}"><img style="float:right;overflow:auto;clear:both;margin-top: 20px" src="${imgLink}"></a>
        </div>
       
  
        <div class="str3s_txt">
        <div class="title" style="margin-top: 16px;margin-right: -10px;text-align: right;color:#FFFFFF;line-height:22px">${title}</div>
        <div class="sub_title sub_title_no_credit" style="margin: 3px 10px 16px 10px; text-align: right;color:#FFFFFF;line-height:17px">${
          article.amlak
        }</div>
        
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

    console.log("number of parents " + div.length);

    let ulMtaItems = div.find("ul.mta_items").clone(true);
    ulMtaItems.css("clear", "both");
    ulMtaItems.css("padding-top", "10px");

    div.empty();

    buildMTAPicDiv(ul, div);
    BuildMTAItems(ulMtaItems);

    div.append(ulMtaItems);
  });
}

function buildMTAPicDiv(ul: JQuery<HTMLElement>, div: JQuery<HTMLElement>) {
  let linkUrl = ul.find("a.mta_pic_link").attr("href");
  console.log("linkUrl: " + linkUrl);

  if (linkUrl === undefined) return;

  let id = linkUrl
    .substring(0, linkUrl.lastIndexOf(".html"))
    .split("/")
    .pop();
  console.log("id: " + id);

  let imgLink = ul.find("img.mta_pic").attr("src");
  console.log("imgLink: " + imgLink);

  let title = ul.find("a.mta_title").text();
  console.log("title: " + title);

  let article = mtaItemsArticles.filter(value => value.id === id)[0];

  let amlak = "";
  if (article != undefined) amlak = article.amlak;

  let e = $.parseHTML(
    `<div style="clear: both">
        <div ><a href="${linkUrl}"><img style="float:right;overflow:auto;clear:both" src="${imgLink}"></a>
        </div>
       
  
        <div class="str3s_txt">
        <div class="title" style="margin-right: 10px">${title}</div>
        <div style="margin-right: 10px">${amlak}</div>
        
        </div>`
  );

  console.log("pushing " + $(e).html());

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
      let subElement = $(element)
        .children()
        .get(1);

      subElement.innerHTML = amlak.amlak;
    }
  });
}

function adjustHeights() {
  console.log("### Adjust Heights");
  $("div.block.B6").each((index, element) => {
    let divs = $(element).find("div.content_wrap");

    console.log("div.content_wrap found: " + divs.length);

    let heights: number[] = [];
    if (divs.length === 2) {
      divs.each((index, element) => {
        heights.push($(element).height());
        // let height = $(element).attr("height");
        // console.log("height found: " + height);
      });

      let maxHeight = Math.max(...heights);

      console.log("max height found: " + maxHeight);

      divs.each((index, element) => {
        if ($(element).height() != maxHeight) {
          $(element).height(maxHeight);
        }
      });
    }
    // console.log("Number of content_wrap divs: " + div.length);
    console.log($(element).attr("class"));

    console.log("content_wraps found: " + divs.length);
  });
}
