/* eslint-disable no-null/no-null */
import type {
  AnyNode,
  Emphasis,
  Heading,
  Html,
  InlineCode,
  Link,
  Literal,
  PhrasingContent,
  Strike,
  Strong,
  Text,
} from './mdast';
import type { Point, Position } from './unist';

import * as CC from './char-codes';
import { Reader } from './reader';

export const DELIMETERS_PAIR = new Map<number, number>([
  [CC.CHAR_LESS_THAN, CC.CHAR_GREATER_THAN],
  [CC.CHAR_SQUARE_BRACKET_OPEN, CC.CHAR_SQUARE_BRACKET_CLOSE],
  [CC.CHAR_PARENTHESIS_OPEN, CC.CHAR_PARENTHESIS_CLOSE],

  [CC.CHAR_BACKTICK, CC.CHAR_BACKTICK],
  [CC.CHAR_ASTERISK, CC.CHAR_ASTERISK],
  [CC.CHAR_UNDERSCORE, CC.CHAR_UNDERSCORE],
  [CC.CHAR_TILDE, CC.CHAR_TILDE],
]);

// export const OPEN_DELIMETERS = new Set([
//   CC.CHAR_PARENTHESIS_OPEN,
//   CC.CHAR_BACKTICK,
//   CC.CHAR_SQUARE_BRACKET_OPEN,
//   CC.CHAR_LESS_THAN,
//   CC.CHAR_ASTERISK,
//   CC.CHAR_UNDERSCORE,
//   CC.CHAR_TILDE,
// ]);

export const NT = {
  Code: 0,
  Emphasis: 1,
  InlineCode: 2,
  Link: 3,
  Html: 4,
  Strike: 5,
  Strong: 6,
  Text: 7,
};

export class ParseRichText {
  private text: string;

  private parentStartPoint: Point;

  private r: Reader;

  private stack: string[] = [];

  private value: string[] = [];

  constructor(text: string, parentStartPoint: Point) {
    this.text = text;
    this.parentStartPoint = parentStartPoint;
    this.r = new Reader(text);
  }

  private normalizePosition(start: Point, end: Point): Position {
    const { column, line, offset } = this.parentStartPoint;

    return {
      start: {
        line: line + start.line - 1,
        column: column - start.column,
        offset: offset + start.offset,
      },
      end: {
        line: line + end.line - 1,
        column,
        offset: offset + end.offset,
      },
    };
  }

  private createLiteralNode(
    type: Text['type'] | InlineCode['type'],
    start: Point,
    end?: Point,
  ): Text | InlineCode {
    const value = this.value.join('');
    this.value = []; // reset

    return {
      type,
      value,
      position: this.normalizePosition(start, end || this.r.getPoint()),
    };
  }

  private parseStrong(c: number, start: Point): PhrasingContent[] {
    console.log("STRONG ENTER", String.fromCharCode(c), this.stack);

    const delimeter = c;

    if (c !== delimeter) return this.parse();

    if (this.r.peek() !== delimeter) return this.parseEmphasis(c, start);

    c = this.r.next(); // skip 1st delimeter
    // c = this.r.next(); // skip 2nd delimeter

    const delimeterStringCh = String.fromCharCode(delimeter);
    const delimeterString = `${delimeterStringCh}${delimeterStringCh}`;
    this.stack[this.stack.length - 1] = delimeterString;

    console.log("STRONG CHILDREN START", this.stack, String.fromCharCode(c));

    const children = this.parse();

    const isClosed = this.stack[this.stack.length - 1] !== delimeterString;

    console.log("STRONG CHILDREN END", children, this.stack, isClosed, String.fromCharCode(c));

    if (!isClosed) {
      // how to return open delimeter?
      return children;
    }

    c = this.r.next(); // skip delimeter

    return [{
      type: 'strong',
      children,
      position: this.normalizePosition(start, this.r.getPoint()),
    }];
  }

  private parseEmphasis(c: number, start: Point): PhrasingContent[] {
    console.log("EMPHASIS ENTER", String.fromCharCode(c), this.stack);

    const openDelimeter = c;
    const openDelimeterCh = String.fromCharCode(openDelimeter);

    if (c !== openDelimeter) return this.parse();

    // c = this.r.next(); // delimeter will be skipped in this.parse()

    console.log("EMPHASIS CHILDREN START ", this.stack, String.fromCharCode(c));

    const children = this.parse();

    const isClosed = this.stack[this.stack.length - 1] !== openDelimeterCh;

    console.log("EMPHASIS CHILDREN END", children, this.stack, isClosed, String.fromCharCode(c));

    if (!isClosed) {
      // how to return open delimeter?
      return children;
    }

    return [{
      type: 'emphasis',
      children,
      position: this.normalizePosition(start, this.r.getPoint()),
    }];
  }

  private parseLink(c: number, start: Point): PhrasingContent[] {
    console.log("LINK ENTER", String.fromCharCode(c), this.stack);

    const openDelimeter = CC.CHAR_SQUARE_BRACKET_OPEN;

    if (c !== openDelimeter) return this.parse();

    // c = this.r.next(); // will be skipped in this.parse()

    const closeDelimeter = DELIMETERS_PAIR.get(openDelimeter);

    if (!closeDelimeter) throw new Error('Invalid close delimeter');

    console.log("LINK CHILDREN START", this.stack, String.fromCharCode(c));

    const children = this.parse();

    console.log("LINK CHILDREN END", children, this.stack, String.fromCharCode(c));

    const closeDelimeterCh = String.fromCharCode(closeDelimeter);
    const isClosed = this.stack[this.stack.length - 1] !== closeDelimeterCh;

    if (!isClosed) {
      // how to return open delimeter?
      return children;
    }

    c = this.r.next(); // skip "]"

    if (c !== CC.CHAR_PARENTHESIS_OPEN) {
      return children;
    }

    c = this.r.next(); // skip "("
    let url = '';
    while (c !== -1 && c !== CC.CHAR_PARENTHESIS_CLOSE) {
      url += String.fromCharCode(c);
      c = this.r.next();
    }

    return [{
      type: 'link',
      url,
      children,
      position: this.normalizePosition(start, this.r.getPoint()),
    }];
  }

  private parseText(c: number, start: Point): PhrasingContent[] {
    console.log("ENTER TEXT", String.fromCharCode(c), this.stack);

    while (c !== -1) {
      const last = this.stack[this.stack.length - 1];
      const ch = String.fromCharCode(c);
      const peekCh = String.fromCharCode(this.r.peek());

      if (last === ch || last === `${ch}${peekCh}`) {
        this.stack.pop(); // clear
        // return [this.createLiteralNode('text', start, this.r.getPoint()), ...this.parse()];
      } else {
        this.value.push(ch);
        c = this.r.next();
      }
    }

    return [this.createLiteralNode('text', start, this.r.getPoint())];
  }

  public parse(): PhrasingContent[] {
    const start = this.r.getPoint();
    const c = this.r.next();

    if (c === -1) return [];

    const matchDelimeter = DELIMETERS_PAIR.get(c);
    if (matchDelimeter) this.stack.push(String.fromCharCode(matchDelimeter));

    console.log("PARSE", String.fromCharCode(c), this.stack);

    switch (c) {
      case CC.CHAR_ASTERISK:
      case CC.CHAR_UNDERSCORE: return this.parseStrong(c, start);
      case CC.CHAR_TILDE:
      case CC.CHAR_SQUARE_BRACKET_OPEN:
        return this.parseLink(c, start);
      default:
        return this.parseText(c, start);
    }
  }
}
