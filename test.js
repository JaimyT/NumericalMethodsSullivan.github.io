import { readFile } from 'node:fs/promises';
import Parser from './libs/parsely.js';

let tagAttr = new Parser.Any(
  new Parser.Sequence(
    Parser.word, Parser.ws, '=', Parser.ws, new Parser.Any(
      Parser.number,
      Parser.string,
      "true", "false", "null"
    )
  ).transform(val => {
    return [val[0], val[2]];
  }),
  Parser.word.transform(val => {
    return [val, true]
  })
);
let openTag = new Parser.Sequence(
  '<', Parser.ws, Parser.word,
  new Parser.Some(new Parser.Any(tagAttr, Parser.ws), 0),
  '>'
).transform((val, src, start, end) => {
  let ret = {};
  let data = val[2];
  if (data) {
    for (let i = 0; i < data.length; i++) {
      if (data[i]) ret[data[i][0]] = data[i][1];
    }
  }
  ret.tagName = val[1];
  return ret;
});
let closeTag = new Parser.Sequence(
  "<", Parser.ws, '/', Parser.ws, Parser.word, Parser.ws, '>'
).joinString();
let tagContents = new Parser.Any(
  new Parser.Regex(/^[^\<\>]+/)
);
let tag = new Parser.Sequence(
  openTag,
  new Parser.Some(tagContents, 0),
  closeTag
).transform((val, src, start, end) => {
  val[0].children = val[1];
  return val[0];
});
tagContents.predicates.push(tag);
let html = new Parser.Some(tag);

(async ()=>{
  try {
    // let structure = [];
    // let i = 0;
    // let mode = "none";
    // let char;
    // const data = await readFile("./chapters/redone/1-intro.html", "utf8");
    // while (i < data.length) {
    //   char = data[i];
    //   switch (char) {
    //     case '<':
          
    //       break;
      
    //     default:
    //       break;
    //   }
    // }
    // const matches = data.matchAll(/id="(.*)"/g);
    // for (let match of matches) {
    //   console.log(match[1]);
    // }
    console.log(JSON.stringify(html.exec("<test meta id=10 attr='why'><foo>f</foo><bar></bar></test>")[2], null, 2));
  } catch (e) {console.error(e);}
})();