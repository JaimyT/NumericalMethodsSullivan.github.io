// Notes and todos

// Todo: default chapter select in url ext so ajax links can specify only the bookmark

// Utils

function utf8_to_str(a) {
    for(var i=0, s=''; i<a.length; i++) {
        var h = a[i].toString(16)
        if(h.length < 2) h = '0' + h
        s += '%' + h
    }
    return decodeURIComponent(s)
}

function startsWithAny(str, ...tests) {
  for (let test of tests) {
    if (str.startsWith(test)) return true;
  }
  return false;
}

// Preprocessing

/**
 * @param {HTMLElement} root 
 */
function preprocess(root) {
  Array.from(root.getElementsByTagName("code")).forEach(el => {
    // Default code elements to Python syntax highlighting
    let found = false;
    for (let cls of el.classList) {
      if (cls.startsWith("language-")) {
        found = true;
        break;
      }
    }
    if (!found) el.classList.add("language-python");
    if (!el.classList.contains("block")) el.classList.add("inline");

    let mindent = Number.MAX_VALUE;
    // Issues with preformatted text
    const lines = el.innerHTML.trimEnd().split('\n');
    while (lines[0]?.length < 1) {
      lines.splice(0, 1);
    }
    let newstr = [];
    for (let line of lines) {
      if (line.length === 0) continue;
      let m = line.match(/^\s*/);
      if (m) mindent = Math.min(mindent, m[0].length);
    }
    if (mindent < Number.MAX_SAFE_INTEGER) {
      for (let line of lines) {
        newstr.push(line.substring(mindent));
      }
    }
    el.innerHTML = hljs.highlightAuto(newstr.join('\n')).value;
  });

  // Mathjax requires that you do not use "math" nodes,
  // so they get replaced on load with "mathy" nodes.
  Array.from(root.getElementsByTagName("math")).forEach(
    /** @param {HTMLElement} el */
    el => {
      let newNode = document.createElement("mathy");
      newNode.classList.add(...el.classList);
      newNode.replaceChildren(...el.childNodes);
      if (!startsWithAny(newNode.innerText, "\\(", "\\[", "\\{")) {
        newNode.innerText = `\\(${newNode.innerText}\\)`;
      }
      el.replaceWith(newNode);
  });
  // root.getElementsByTagName("math").forEach(el => {
  //   el.classList.add("math", "inline");
  // });
}

// Loading and bookmarking

class Bookmark {
  constructor(parent, title, location) {
    this.parent = parent;
    this.title = title;
    this.location = location;
    this.element = document.createElement("a");
    this.element.href = this.link;
  }

  get link() {
    return `#chapter=${this.chapter}&bookmark=${this.location}`;
  }
}

class Chapter {
  constructor(id, title, path, bookmarks = []) {
    this.id = id;
    this.title = title;
    this.path = path;
    this.bookmarks = [];
    for (let item of bookmarks) {
      this.bookmarks.push(new Bookmark(this, ...item));
    }
    this.scroll = 0;
    this.cache = null;
  }

  async load() {
    if (!this.cache) try {
      let res = await fetch(this.path);
      let strSource = [];
      for await (const chunk of res.body) strSource.push(utf8_to_str(chunk));

      this.cache = document.createElement("html");
      this.cache.innerHTML = strSource.join('');
      preprocess(this.cache);
    } catch (e) {
      console.error(`Failed to load chapter ${this.title} from ${this.path}`, e);
    }
  }
}

const contents = new (class Contents {
  chapterSources = [
    ["front", "Front Matter", "./chapters/redone/0-front.html"],
    ["intro", "Introduction", "./chapters/redone/1-intro.html"],
    ["algebra", "Algebra", "./chapters/ch-algebra.html"],
    ["calculus", "Calculus", "./chapters/ch-calculus.html"],
    ["linearalgebra", "Linear Algebra", "./chapters/ch-linearalgebra.html"],
    ["odes", "Odes", "./chapters/ch-odes.html"],
    ["pdes", "Pdes", "./chapters/ch-pdes.html"],
    ["python", "Python", "./chapters/ch-python.html"],
    ["writing", "Writing", "./chapters/ch-writing.html"],
    ["extras", "Extras", "./chapters/ch-extras.html"],
    ["references", "References", "./references.html"]
  ];
  chapters = {};
  bookmarks = [
    [
      // ["Front Matter", "frontmatter"],
      // ["Preface", "preface"],
      // ["Acknowledgements", "acknowledgements"],
      // ["To the Student", "tothestudent"],
      // ["To the Instructor", "totheinstructor"],
      // ["The IBL Approach", "theiblapproach"],
      // ["The Projects", "theprojects"],
      // ["Coding", "coding"],
      // ["Pacing", "pacing"],
      // ["Other Considerations", "otherconsiderations"]
    ], [

    ]
  ];
  constructor() {
    let chapter;
    for (let i = 0; i < this.chapterSources.length; i++) {
      chapter = new Chapter(...this.chapterSources[i], this.bookmarks[i] ?? []);
      this.chapters[this.chapterSources[i][0]] = chapter;
      this.chapters[i] = chapter;
    }
  }
})();
/** Saves the user's scroll position per chapter, addressing a specific gripe users had with the original. */
const chapterScrolls = {};
const rooturlregex = /^.*\//;
const rooturl = rooturlregex.exec(window.location.href);
let currentChapter = 0;

/**
 * 
 * @param {string} str 
 */
function parseUrlExt(str) {
  let i = "".indexOf('#');
  if (i !== -1) str = str.substring(i+1);
  let ret = {};
  if (isFinite(+str)) {
    // Shortcuts for chapters. Makes links as simple as "#1"
    // Todo? Extend to include bookmarks, like: "#1.1", possibly "#1.e1"
    ret.chapter = +str;
    return ret;
  }
  let key, value;
  for (let item of str.split('&')) {
    [key, value] = item.split('=');
    if (key) ret[key] = value;
  }
  return ret;
}

const defaultChapter = 0;
function overrideurl(urldata = null) {
  urldata ??= {};
  urldata.chapter ??= defaultChapter;
  let urlext = [];
  for (let key in urldata) {
    if (Object.hasOwn(urldata, key)) {
      urlext.push(`${key}=${urldata[key]}`);
    }
  }
  window.location.href = `${window.location.href.split('#')[0]}#${urlext.join('&')}`;
}
function amendurl(newurldata, oldurl = null) {
  oldurl ??= window.location.href;
  let data = parseUrlExt(oldurl);
  for (let key in newurldata) {
    if (Object.hasOwn(newurldata, key)) {
      data[key] ??= newurldata[key];
    }
  }
  overrideurl(data);
}
function checkreseturl(url = null) {
  url ??= window.location.href;
  let urlext;
  if (url?.includes("#")) {
    urlext = parseUrlExt(url.substring(url.indexOf('#') + 1));
  }
  if (!(urlext?.chapter)) {
    const urlParts = url.split('#');
    if (urlParts.length > 1) {
      console.log("Resetting url to", `${urlParts[0]}#chapter=${defaultChapter}&${urlParts[1]}`);
      window.location.href = `${urlParts[0]}#chapter=${defaultChapter}&${urlParts[1]}`;
      return;
    } else {
      console.log("Resetting url to", `${urlParts[0]}#chapter=${defaultChapter}`);
      window.location.href = `${urlParts[0]}#chapter=${defaultChapter}`;
      return;
    }
  }
  return urlext;
}

async function loadPage(urldata) {
  try {
    let index = urldata.chapter;
    if (isFinite(+index)) index = +index;
    let chapter = contents.chapters[index];
    let path = chapter?.path;
    if (!path) {
      console.log(`Path not found: ${path}; urldata: ${JSON.stringify(urldata)}`);
      console.log(contents.chapters);
      return overrideurl();
    }
    // let res = await fetch(path);
    // let strSource = [];
    // for await (const chunk of res.body) {
    //   strSource.push(utf8_to_str(chunk));
    // }
    // let tmp = document.createElement("html");
    // tmp.innerHTML = strSource.join('');
    let container = document.getElementById("content");
    await chapter.load();
    // container.replaceChildren(...tmp.getElementsByClassName("book-body"));
    container.replaceChildren(...chapter.cache.getElementsByTagName("body")[0].children);
    container.scrollTo(0, chapterScrolls[currentChapter] ?? 0);
  } catch (e) {
    console.error(e.message);
  }
}

function hashChange(evt) {
  // console.log("Hashchange");
  let urlext = checkreseturl(evt.newURL);
  if (urlext) {
    // console.log(evt.newURL);
    loadPage(urlext);
  }
}
window.addEventListener("hashchange", hashChange);

document.getElementById("content").addEventListener("scrollend", evt => {
  chapterScrolls[currentChapter] = document.getElementById("content").scrollHeight;
});

// This actually works! Yessssssssss!
// document.getElementById("theme").setAttribute("href", "./dark.css");

hashChange({newURL:window.location.href});