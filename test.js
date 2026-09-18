import { readFile } from 'node:fs/promises';
import Parser from './libs/parsely.js';

let openTag = new Parser.Sequence(
  '<', Parser.ws, new Parser.Regex(/^\w*/), Parser.ws, '>'
).audit((val, src, start, end) => {
  return [true, end, val[2]];
});
let closeTag = new Parser.Sequence(
  "<", Parser.ws, '/', Parser.ws, new Parser.Regex(/^\w*/), Parser.ws, '>'
).joinString();
let tagContents = new Parser.Any(
  new Parser.Regex(/^[^\<\>]+/)
);
let tag = new Parser.Sequence(
  openTag,
  new Parser.Some(tagContents, 0),
  closeTag
).audit((val, src, start, end) => {
  let ret = {
    tagName: val[0],
    contents: val[1]
  };
  return [true, end, ret];
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
    console.log(JSON.stringify(html.exec("<test><foo>f</foo><bar></bar></test>")[2], null, 2));
  } catch (e) {console.error(e);}
})();