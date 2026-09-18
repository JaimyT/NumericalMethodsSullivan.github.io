function strat(str, i, val) {
  return str.substring(i, i + val.length) === val;
}
function nextOfAny(str, i, ...substrings) {
  let index;
  let retIndex = str.length;
  let ret = '';
  for (let substring of substrings) {
    index = str.indexOf(substring, i);
    if (index !== -1 && index < retIndex) {
      ret = substring;
      retIndex = index;
    }
  }
  return [retIndex, ret];
}
function isString(v) {
  return ((typeof v) === "string") || (v instanceof String);
}

/**
 * @interface
 */
export default class Parser {
  /**
   * @param {string} str 
   * @param {number} i 
   * @returns {[status:boolean, newIndex:number, value:*]}
   */
  exec(str, i = 0) {
    return [true, i+1, str[i]];
  }
  static Sub = class Sub extends Parser {
    constructor(str) {
      super();
      this.str = str;
    }
    exec(str, i = 0) {
      if (strat(str, i, this.str)) {
        return [true, i + this.str.length, this.str];
      }
      return [false, i];
    }
  }
  static EnclosedEscaped = class EncEsc extends Parser {
    constructor(open, escape, close) {
      super();
      this.open = open;
      this.escape = escape;
      this.close = close;
    }

    exec(str, i = 0) {
      let ret = [];
      let index = -1;
      let type;
      if (strat(str, i, this.open)) {
        let newi = i + this.open.length;
        while (newi < str.length) {
          [index, type] = nextOfAny(str, newi, this.escape, this.close);
          if (index === -1) break;
          else {
            switch (type) {
              case this.escape:
                ret.push(str.substring(newi, index));
                ret.push(this.close);
                newi = index + this.escape.length + this.close.length;
                break;
              case this.close:
                ret.push(str.substring(newi, index));
                newi = index + this.close.length;
                return [true, newi, ret.join('')];
              default:
                newi = str.length;
                break;
            }
          }
        }
      }
      return [false, i];
    }
  }
  static Regex = class Regex extends Parser {
    constructor(regex, skip = true) {
      super();
      this.regex = regex;
      this.skip = skip;
    }
    exec(str, i = 0) {
      let result = str.substring(i).match(this.regex);
      if (result) {
        let newi = i + result.index + result[0].length;
        if (this.skip) {
          return [true, newi, result[0]];
        } else {
          return [true, newi, str.substring(i, newi)];
        }
      }
      return [false, i];
    }
  }
  static AnyChar = class AnyChar extends Parser.Regex {
    constructor(chars) {
      super(new RegExp(`^[${chars}]`));
    }
  }
  static AnySub = class AnySub extends Parser {
    constructor(...substrings) {
      super();
      this.substrings = substrings;
    }
    exec(str, i = 0) {
      let [index, val] = nextOfAny(str, i, this.substrings);
      if (index === -1) return [false, i];
      return [true, index + val.length, val];
    }
  }
  static Optional = class Optional extends Parser {
    constructor(predicate) {
      super();
      this.predicate = predicate;
    }
    exec(str, i = 0) {
      let [stat, newi, ret] = this.predicate.exec(str, i);
      return [true, stat ? newi : i, ret];
    }
  }
  static Sequence = class Sequence extends Parser {
    constructor(...predicates) {
      super();
      this.predicates = predicates;
      let predicate;
      for (let i = 0; i < predicates.length; i++) {
        predicate = predicates[i];
        if (isString(predicate)) {
          this.predicates[i] = new Parser.Sub(predicate);
        }
      }
    }
    exec(str, i = 0) {
      let index = i;
      let ret = [];
      let stat, val;
      for (let predicate of this.predicates) {
        [stat, index, val] = predicate.exec(str, index);
        if (!stat) {
          return [false, i];
        }
        ret.push(val);
      }
      return [true, index, ret];
    }
    then(predicate) {
      if (isString(predicate)) {
        this.predicates.push(new Parser.Sub(predicate));
      } else {
        this.predicates.push(predicate);
      }
      return this;
    }
  }
  static Some = class Some extends Parser {
    constructor(predicate, min = 1, max = Number.MAX_SAFE_INTEGER) {
      super();
      this.predicate = predicate;
      this.min = min;
      this.max = max;
    }
    exec(str, i = 0) {
      let ret = [];
      let newi = i;
      let stat, index, val;
      for (let j = 0; j <= this.max; j++) {
        [stat, index, val] = this.predicate.exec(str, newi);
        if (stat) {
          ret.push(val);
          newi = index;
        } else {
          if (j < this.min) {
            return [false, i];
          } else {
            return [true, newi, ret];
          }
        }
        if (j === this.max || j >= str.length) {
          return [true, newi, ret];
        }
      }
      return [this.min <= 0, i, []];
    }
  }
  static Any = class Any extends Parser {
    constructor(...predicates) {
      super();
      this.predicates = predicates;
    }
    exec(str, i = 0) {
      let stat, index, val;
      for (let predicate of this.predicates) {
        [stat, index, val] = predicate.exec(str, i);
        if (stat) return [stat, index, val];
      }
      return [false, i];
    }
  }
  static digits = new Parser.Regex(/\d+/);
  static number = new Parser.Regex(/^[\+\-]?(([\d_]*\._*\d[\d_]*)|(_*\d[\d_]*))/);
  static string = new Parser.Regex(/^(['"])((\\.)|[^'"])*\1/);
  static ws = new Parser.Regex(/^\s*/);

  optional() {
    return new Parser.Optional(this);
  }
  optionalThen(predicate) {
    if (isString(predicate)) {
      return this.then(new Parser.Sub(predicate).optional());
    } else {
      return this.then(predicate.optional());
    }
  }
  then(predicate) {
    if (isString(predicate)) {
      return new Parser.Sequence(this, new Parser.Sub(predicate));
    } else {
      return new Parser.Sequence(this, predicate);
    }
  }

  /**
   * Executes a parsing predicate and, if it is successful,
   * passes the result to a consumer function and returns
   * the value from that.
   */
  static Custom = class Custom extends Parser {
    /**
     * @param {(val:*, source:string, start:number, end:number)=>[status:boolean, index:number, val:*]} fn 
     * @param {Parser} predicate 
     * @param {boolean} audit If true, the return value of the function will be the return value of exec()
     */
    constructor(fn, predicate, audit = false) {
      super();
      this.fn = fn;
      this.predicate = predicate;
      this.audit = audit;
    }

    exec(str, i = 0) {
      let ret;
      let [stat, index, val] = ret = this.predicate.exec(str, i);
      if (this.audit) {
        if (stat) {
          [stat, index, val] = this.fn(val, str, i, index);
        }
        if (stat) return [stat, index, val];
        return [false, i];
      }
      if (stat) this.fn(val, str, i, index);
      return ret;
    }
  }
  /**
   * @param {(val:*, source:string, start:number, end:number)=>[status:boolean, index:number, val:*]} fn
   */
  consume(fn) {
    return new Parser.Custom(fn, this, false);
  }
  /**
   * @param {(val:*, source:string, start:number, end:number)=>[status:boolean, index:number, val:*]} fn
   */
  audit(fn) {
    return new Parser.Custom(fn, this, true);
  }

  joinString() {
    return this.audit((val, src, start, end) => {
      if (val.join) return [true, end, val.join('')];
      else return [true, end, val];
    });
  }
}