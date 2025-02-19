/* eslint-disable no-null/no-null */

import type { Point, Position } from './unist';

import * as CC from './char-codes';
import { Reader } from './reader';

export type TokenType =
  | 'Blockquote'
  | 'Code'
  | 'Heading'
  | 'Html'
  | 'Paragraph'
  | 'Text';

export type Range = [number, number];

export interface TokenBase {
  type: TokenType;
  value: string;
  position: Position;
  range: Range;
}

export interface TokenBlockquote extends TokenBase {
  type: 'Blockquote';
}

export interface TokenCode extends TokenBase {
  type: 'Code';
}

export interface TokenHeading extends TokenBase {
  type: 'Heading';
  depth?: number;
}

export interface TokenHtml extends TokenBase {
  type: 'Html';
  tagName?: string;
  isVoidElement?: boolean;
}

export interface TokenText extends TokenBase {
  type: 'Text';
}

export interface TokenParagraph extends TokenBase {
  type: 'Paragraph';
}

export type Token =
  | TokenBlockquote
  | TokenCode
  | TokenHeading
  | TokenHtml
  | TokenParagraph
  | TokenText;

export const TOKEN_TYPE = {
  EOF: 0,
  Heading: 1,
  Blockquote: 2,
  Code: 3,
  Html: 4,
  Text: 5,
  Paragraph: 6,
};

export const WHITESPACES = new Set([
  CC.CHAR_SPACE,
  CC.CHAR_TAB,
  CC.CHAR_NEWLINE,
  CC.CHAR_RETURN,
]);

export class Tokenizer {
  private reader: Reader;

  private text: string;

  private value: string[] = [];

  private t: Token = {
    type: 'Text',
    value: '',
    position: {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 1, column: 1, offset: 0 },
    },
    range: [0, 0],
  };

  constructor(text: string) {
    this.text = text;
    this.reader = new Reader(text);
  }

  static isWhitespace(c: number): boolean {
    return WHITESPACES.has(c);
  }

  static isVoidElement(tagName: string): boolean {
    const voidElements = new Set([
      'area',
      'base',
      'br',
      'col',
      'embed',
      'hr',
      'img',
      'input',
      'link',
      'meta',
      'param',
      'source',
      'track',
      'wbr',
    ]);
    return voidElements.has(tagName.toLowerCase());
  }

  private createToken(
    tokenType: TokenType,
    startPoint: Point,
    endPoint?: Point,
    parts?: Record<string, unknown>,
  ): Token {
    const value = this.value.join('');
    const length = value.length;
    this.value = []; // reset

    const endOffset = endPoint ? endPoint.offset : startPoint.offset + length;
    const range: Range = [startPoint.offset, endOffset];

    return {
      type: tokenType,
      value,
      position: {
        start: startPoint,
        end: endPoint || {
          line: startPoint.line,
          column: startPoint.column + length,
          offset: endOffset,
        },
      },
      range,
      ...(parts || {}),
    };
  }

  private readHeading(c: number, start: Point): Token {
    this.value.push(String.fromCharCode(c));
    let depth = 1;

    while (this.reader.peek() === CC.CHAR_HASH) {
      depth++;
      c = this.reader.next();
      this.value.push(String.fromCharCode(c));
    }

    if (this.reader.peek() === CC.CHAR_SPACE) {
      c = this.reader.next();
      this.value.push(String.fromCharCode(c));
    }

    let peek = this.reader.peek();

    while (peek !== -1 && peek !== CC.CHAR_NEWLINE && peek !== CC.CHAR_RETURN) {
      c = this.reader.next();
      this.value.push(String.fromCharCode(c));
      peek = this.reader.peek();
    }

    const parts = { depth };
    return this.createToken('Heading', start, undefined, parts);
  }

  private readHtml(c: number, start: Point): Token {
    let htmlBlock = '';
    htmlBlock += String.fromCharCode(c); // '<'
    c = this.reader.next();

    while (c !== -1 && c !== CC.CHAR_GREATER_THAN) {
      htmlBlock += String.fromCharCode(c);
      c = this.reader.next();
    }

    if (c !== -1) {
      htmlBlock += String.fromCharCode(c); // '>'
    }

    if (htmlBlock.startsWith('</')) {
      this.value.push(htmlBlock);
      return this.createToken('Html', start, this.reader.getPoint());
    }

    let tagName = '';

    for (let i = 1; i < htmlBlock.length; i++) {
      const ch = htmlBlock[i];
      if (ch === ' ' || ch === '\t' || ch === '>' || ch === '/') break;
      tagName += ch;
    }

    const isVoidElement = Tokenizer.isVoidElement(tagName);

    if (htmlBlock.endsWith('/>') || isVoidElement) {
      this.value.push(htmlBlock);
      const end = this.reader.getPoint();
      const parts = { tagName, isVoidElement };
      return this.createToken('Html', start, end, parts);
    }

    const desiredClosing = `</${tagName}>`;
    let buffer = '';

    while (c !== 1) {
      c = this.reader.next();
      if (c === -1) break;
      const ch = String.fromCharCode(c);
      htmlBlock += ch;
      buffer += ch;
      if (buffer.length > desiredClosing.length) {
        buffer = buffer.slice(-desiredClosing.length);
      }
      if (buffer.toLowerCase() === desiredClosing.toLowerCase()) break;
    }

    this.value.push(htmlBlock);

    const parts = { tagName, isVoidElement };

    return this.createToken('Html', start, undefined, parts);
  }

  private readCode(c: number, start: Point): Token {
    const delimeter = c;
    let openDelimeter = String.fromCharCode(delimeter);

    c = this.reader.next();

    while (c !== -1 && c === delimeter) {
      openDelimeter += String.fromCharCode(c);
      c = this.reader.next();
    }

    let value = '';

    while (c !== -1 && c !== delimeter) {
      value += String.fromCharCode(c);
      c = this.reader.next();
    }

    let closeDelimiter = '';

    while (c !== -1 && c === delimeter) {
      closeDelimiter += String.fromCharCode(c);
      c = this.reader.next();
    }

    const end = this.reader.getPoint();

    if (start.line === end.line) {
      this.value = [openDelimeter, value, closeDelimiter];
      return this.createToken('Paragraph', start, end);
    }

    this.value = [value];
    return this.createToken('Code', start, end);
  }

  // Blockquote: a line starting with '>'
  private readBlockquote(c: number, start: Point): Token {
    this.value.push(String.fromCharCode(c));

    if (this.reader.peek() === CC.CHAR_SPACE) {
      c = this.reader.next();
      this.value.push(String.fromCharCode(c));
    }

    let peek = this.reader.peek();

    while (peek !== -1 && peek !== CC.CHAR_NEWLINE && peek !== CC.CHAR_RETURN) {
      c = this.reader.next();
      this.value.push(String.fromCharCode(c));
      peek = this.reader.peek();
    }

    return this.createToken('Blockquote', start);
  }

  private readParagraph(c: number, start: Point): Token {
    while (c !== -1) {
      if (c === CC.CHAR_NEWLINE || c === CC.CHAR_RETURN) {
        const nextChar = this.reader.peek();
        if (nextChar === CC.CHAR_NEWLINE || nextChar === CC.CHAR_RETURN) {
          break;
        }
        this.value.push(String.fromCharCode(c));
        c = this.reader.next();
        continue;
      }

      this.value.push(String.fromCharCode(c));
      c = this.reader.next();
    }

    return this.createToken('Paragraph', start, this.reader.getPoint(), undefined);
  }

  private readToken(c: number): Token {
    const start = this.reader.getPoint();

    switch (c) {
      case CC.CHAR_HASH: return this.readHeading(c, start);
      case CC.CHAR_GREATER_THAN: return this.readBlockquote(c, start);
      case CC.CHAR_BACKTICK: return this.readCode(c, start);
      case CC.CHAR_LESS_THAN: return this.readHtml(c, start);
      default: return this.readParagraph(c, start);
    }
  }

  next(): number {
    let c = this.reader.next();

    while (Tokenizer.isWhitespace(c)) {
      c = this.reader.next();
    }

    if (c === -1) return TOKEN_TYPE.EOF;

    this.t = this.readToken(c);

    return TOKEN_TYPE[this.t.type];
  }

  get token(): Token {
    return this.t;
  }
}

export function tokenize(text: string): Token[] {
  const tokenizer = new Tokenizer(text);
  const tokens: Token[] = [];

  while (tokenizer.next() !== TOKEN_TYPE.EOF) {
    tokens.push(tokenizer.token);
  }

  return tokens;
}
