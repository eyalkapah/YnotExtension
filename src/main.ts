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

let mtaItemsArticles: Article[] = [];

function extractHomePage(data: Array<Article>) {
  mtaItemsArticles = data;

  console.log("extracting home page");
  removeBanners();
  extractStr3s();
  //extractMtaPic();
  extractContentWrap();
  //extractMTA(data);
  adjustHeights();
}

let mtaPicsArticles: Article[] = [];

function removeBanners() {
  let element = $('div[data-tb-region*="News"]').first();
  let p = element.parentsUntil("div.block.B6").last();
  let p6 = p.parent();
  let p6Closest = p6.prev("div.block.B6");

  if (p6Closest != undefined) p6Closest.remove();
}

function extractStr3s() {
  let heightArray: number[] = [];

  $("div.str3s_txt").each((index, element) => {
    let article = Helpers.ExtractStr3s(element);

    if (article === undefined) {
      heightArray.push(0);
      return;
    }

    let result = mtaItemsArticles.filter(value => value.id === article!.id);

    if (result.length != 1) {
      heightArray.push(0);
      return;
    }

    let amlak = result[0];

    let numOfLines = Math.ceil(amlak.amlak.length / 52);
    let height = numOfLines * 17 + 50;

    heightArray.push(height);
    // p.css("height", "120px");
    $(element).css("height", height);

    let subElement = $(element)
      .children()
      .get(1);

    //subElement.remove();

    subElement.innerHTML = amlak.amlak;
  });

  let maxHeight = Math.max(...heightArray);

  if (maxHeight != undefined && maxHeight != 0) {
    $(
      ".str3s_small.str3s_type_small,.str3s_small.str3s_type_small > .cell,.str3s_small.str3s_type_small > .cell > a,.str3s_small.str3s_type_small > .cell > .str3s_img > img"
    ).each((index, element) => {
      $(element).css("height", maxHeight);
    });
  }
}

function extractArticle(): Article {
  let article = new Article();

  let titleElement = $(".art_header_title").get(0);

  article.subtitle = titleElement.innerHTML;

  let amlakElement = $(".art_header_sub_title").get(0);

  article.amlak = amlakElement.innerHTML;

  return article;
}

function extractMTA() {
  let clones: Array<JQuery.Node[]> = [];

  $(
    "div.content_wrap > .mta_pic_items > li, .multiarticles.mta_3 > .content_wrap > .mta_pic_items > li"
  ).each((index, element) => {
    console.log("extracting mta_item " + index);

    let li = $(element);

    let a = li.find(
      ".multiarticles.mta_2 .mta_pic_link, .multiarticles.mta_3 .mta_pic_link, .multiarticles.mta_2 .mta_pic, .multiarticles.mta_3 .mta_pic"
    );

    if (a === undefined) {
      console.log("<a> not found!");
      return;
    }

    let href = a.attr("href");
    let id = href
      .substring(0, href.lastIndexOf(".html"))
      .split("/")
      .pop();
    console.log("id: " + id);

    let article = mtaPicsArticles.filter(value => value.id === id)[0];

    if (article === undefined) {
      console.log("article is undefined exiting");
      return;
    }

    //if (article === undefined) return;

    //let result = data.filter(value => value.id === article!.id);

    // let amlak = result[0];
    // amlak.amlak += amlak.amlak;

    // let numOfLines = Math.ceil(amlak.amlak.length / 52);
    // let height = numOfLines * 17;

    // let e = $.parseHTML(
    //   `<li class="relative_block" style="height: ${height}px;clear:both"><div>
    //   <div ><a><img style="float:right;overflow:auto;clear:both" src="${
    //     article.imgLink
    //   }"></a>
    //   </div>

    //   <div class="str3s_txt">
    //   <div class="title" style="margin-right: 10px">${article.title}</div>
    //   <div style="margin-right: 10px">${result[0].amlak}</div>

    //   </div></li>`
    // );

    let e = $.parseHTML(
      `<div>
      <div ><a><img style="float:right;overflow:auto;clear:both" src="${
        article.imgLink
      }"></a>
      </div>
     

      <div class="str3s_txt">
      <div class="title" style="margin-right: 10px">${article.title}</div>
      <div style="margin-right: 10px">amlak goes here</div>
      
      </div>`
    );

    console.log("pushing " + $(e).html());
    clones.push(e);
  });

  // Delete MTA_PIC
  $(
    "div.content_wrap > .mta_pic_items, .multiarticles.mta_3 > .content_wrap > .mta_pic_items"
  ).remove();

  // Add new custom MTA_PIC
  $("div.content_wrap").each((index, element) => {
    $(element).empty();

    let e = clones[index];
    console.log("adding " + $(e).html());
    $(element).append(clones[index]);
  });

  $(
    ".multiarticles.mta_4 > .content_wrap .mta_items_wrap, .multiarticles.mta_3 > .content_wrap .mta_items_wrap"
  ).each((index, element) => {
    $(element).css("margin-right", "10px");
  });

  //let div = $(".str3s.str3s_small.str3s_type_small").first().clone();

  // $("ul.mta_items").each((index, element) => {
  //   $(element).prepend(clones[index]);
  // });

  $("ul.mta_items > li").each((index, element) => {
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

  // $("ul.mta_items > li").each((index, element) => {

  //   }
  // });
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
