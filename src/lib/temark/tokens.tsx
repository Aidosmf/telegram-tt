/* eslint-disable no-null/no-null */

import type { Point, Position } from './unist';

import * as CC from './char-codes';
import { Reader } from './reader';

export type TokenType =
  | 'Blockquote'
  | 'Code'
  | 'Emphasis'
  | 'Heading'
  | 'Html'
  | 'Image'
  | 'InlineCode'
  | 'Link'
  | 'Strike'
  | 'Strong'
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
  lang?: string;
}

export interface TokenEmphasis extends TokenBase {
  type: 'Emphasis';
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

export interface TokenImage extends TokenBase {
  type: 'Image';
}

export interface TokenInlineCode extends TokenBase {
  type: 'InlineCode';
}

export interface TokenLink extends TokenBase {
  type: 'Link';
}

export interface TokenStrike extends TokenBase {
  type: 'Strike';
}

export interface TokenStrong extends TokenBase {
  type: 'Strong';
}

export interface TokenText extends TokenBase {
  type: 'Text';
}

export type Token =
  | TokenBlockquote
  | TokenCode
  | TokenEmphasis
  | TokenHeading
  | TokenHtml
  | TokenImage
  | TokenInlineCode
  | TokenLink
  | TokenStrike
  | TokenStrong
  | TokenText;

export const TOKEN_TYPE = {
  EOF: 0,
  Heading: 1,
  Blockquote: 2,
  Code: 3,
  InlineCode: 4,
  Link: 5,
  Image: 6,
  Html: 7,
  Strong: 8,
  Emphasis: 9,
  Strike: 10,
  Text: 11,
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
    const delimeterValue = String.fromCharCode(delimeter);

    c = this.reader.next();
    let open = 1;

    while (c !== -1 && c === delimeter) {
      c = this.reader.next();
      open++;
    }

    const delimeterLimit = open < 3 ? 1 : 3;

    while (open > delimeterLimit) {
      this.value.push(delimeterValue);
      open--;
    }

    while (c !== -1 && c !== delimeter) {
      this.value.push(String.fromCharCode(c));
      c = this.reader.next();
    }

    let close = 0;

    while (c !== -1 && c === delimeter) {
      c = this.reader.next();
      close++;
    }

    if (close === 1) {
      // TODO: avoid unshift
      if (delimeterLimit >= 3) this.value.unshift(delimeterValue, delimeterValue);

      return this.createToken('InlineCode', start, this.reader.getPoint());
    }

    if (close !== delimeterLimit) {
      while (close > 0) {
        this.value.push(delimeterValue);
        close--;
      }

      while (open > 0) {
        // TODO: avoid unshift
        this.value.unshift(delimeterValue);
        open--;
      }

      return this.createToken('Text', start, this.reader.getPoint());
    }
    const end = this.reader.getPoint();

    if (start.line === end.line) {
      return this.createToken('InlineCode', start, this.reader.getPoint());
    } else {
      return this.createToken('Code', start, this.reader.getPoint());
    }
  }

  // Link: [text](url)
  private readLink(c: number, start: Point): Token {
    this.value.push(String.fromCharCode(c));
    c = this.reader.next();

    while (c !== -1 && c !== CC.CHAR_SQUARE_BRACKET_CLOSE) {
      this.value.push(String.fromCharCode(c));
      c = this.reader.next();
    }

    if (c !== -1) {
      this.value.push(String.fromCharCode(c));
    }

    if (this.reader.peek() === CC.CHAR_PARENTHESIS_OPEN) {
      c = this.reader.next();
      this.value.push(String.fromCharCode(c));
      c = this.reader.next();

      while (c !== -1 && c !== CC.CHAR_PARENTHESIS_CLOSE) {
        this.value.push(String.fromCharCode(c));
        c = this.reader.next();
      }

      if (c !== -1) {
        this.value.push(String.fromCharCode(c));
      }
    }

    return this.createToken('Link', start);
  }

  // Image: ![alt](url)
  private readImage(c: number, start: Point): Token {
    if (this.reader.peek() !== CC.CHAR_SQUARE_BRACKET_OPEN) return this.readText(c, start);

    this.value.push(String.fromCharCode(c)); // "!"
    c = this.reader.next();

    this.value.push(String.fromCharCode(c)); // "["
    c = this.reader.next();

    while (c !== -1 && c !== CC.CHAR_SQUARE_BRACKET_CLOSE) {
      this.value.push(String.fromCharCode(c));
      c = this.reader.next();
    }

    if (c !== -1) {
      this.value.push(String.fromCharCode(c)); // ]
    }

    if (this.reader.peek() === CC.CHAR_PARENTHESIS_OPEN) {
      c = this.reader.next();

      this.value.push(String.fromCharCode(c));
      c = this.reader.next();

      while (c !== -1 && c !== CC.CHAR_PARENTHESIS_CLOSE) {
        this.value.push(String.fromCharCode(c));
        c = this.reader.next();
      }

      if (c !== -1) {
        this.value.push(String.fromCharCode(c));
      }
    }

    return this.createToken('Image', start);
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

  // Strong: text wrapped in double '*' or '_'
  private readStrong(
    c: number,
    start: Point,
    tokenType: TokenType,
  ): Token {
    const delimiterLimit = 2;
    const delimiterCode = c;
    const delimiterValue = String.fromCharCode(delimiterCode);

    let open = delimiterLimit;
    c = this.reader.next();

    while (c !== 1 && this.reader.peek() === delimiterCode) {
      c = this.reader.next();
      open++;

      if (open > delimiterLimit) {
        this.value.push(delimiterValue);
        open--;
      }
    }

    if (c === CC.CHAR_RETURN) {
      return this.createToken('Text', start);
    }

    c = this.reader.next();

    while (c !== 1 && c !== delimiterCode) {
      this.value.push(String.fromCharCode(c));
      c = this.reader.next();
    }

    let close = 0;

    while (c !== 1 && c === delimiterCode) {
      c = this.reader.next();
      close += 1;

      if (close > delimiterLimit) {
        this.value.push(delimiterValue);
        close--;
      }
    }

    if (close === 1) {
      // TODO: avoid unshift
      this.value.unshift(delimiterValue);
      return this.createToken('Emphasis', start);
    }

    return this.createToken(tokenType, start, this.reader.getPoint());
  }

  // Strike: text wrapped in double '~'
  private readStrike(
    c: number,
    start: Point,
  ): Token {
    const delimiterLimit = 2;
    const delimiterCode = c;
    const delimiterValue = String.fromCharCode(delimiterCode);

    let open = delimiterLimit;
    c = this.reader.next();

    while (c !== 1 && this.reader.peek() === delimiterCode) {
      c = this.reader.next();
      open++;

      if (open > delimiterLimit) {
        this.value.push(delimiterValue);
        open--;
      }
    }

    if (c === CC.CHAR_RETURN) {
      return this.createToken('Text', start);
    }

    c = this.reader.next();

    while (c !== 1 && c !== delimiterCode) {
      this.value.push(String.fromCharCode(c));
      c = this.reader.next();
    }

    let close = 0;

    while (c !== 1 && c === delimiterCode) {
      c = this.reader.next();
      close += 1;
    }

    if (close === 1) {
      this.value.push(delimiterValue);
      return this.readText(c, start);
    }

    while (close > delimiterLimit) {
      this.value.push(delimiterValue);
      close--;
    }

    return this.createToken('Strike', start, this.reader.getPoint());
  }

  // Emphasis: text wrapped in a single '*' or '_'
  private readEmphasis(c: number, start: Point): Token {
    if (c !== CC.CHAR_ASTERISK && c !== CC.CHAR_UNDERSCORE) return this.readText(c, start);

    const tokenType = 'Emphasis';
    const delimiterCode = c;
    const delimiterLimit = 1;
    const delimiterValue = String.fromCharCode(delimiterCode);

    let open = 0;

    while (c !== 1 && c === delimiterCode) {
      c = this.reader.next();
      open++;

      if (open > delimiterLimit) {
        this.value.push(delimiterValue);
        open--;
      }
    }

    while (c !== 1 && c !== delimiterCode && !this.reader.isNewLine) {
      this.value.push(String.fromCharCode(c));
      c = this.reader.next();
    }

    let close = 0;

    while (c !== 1 && c === delimiterCode) {
      c = this.reader.next();
      close += 1;
    }

    if (close === 0) {
      // TODO: avoid unshift
      this.value.unshift(delimiterValue);
      return this.readText(c, start);
    }

    while (close > delimiterLimit) {
      this.value.push(delimiterValue);
      close--;
    }

    return this.createToken(tokenType, start, this.reader.getPoint());
  }

  private readText(c: number, start: Point): Token {
    while (
      c !== -1
      && c !== CC.CHAR_NEWLINE
      && c !== CC.CHAR_RETURN
    ) {
      this.value.push(String.fromCharCode(c));
      c = this.reader.next();
    }

    return this.createToken('Text', start);
  }

  private readToken(c: number): Token {
    const start = this.reader.getPoint();
    const peek = this.reader.peek();

    switch (c) {
      case CC.CHAR_HASH: return this.readHeading(c, start);
      case CC.CHAR_GREATER_THAN: return this.readBlockquote(c, start);
      case CC.CHAR_BACKTICK: return this.readCode(c, start);
      case CC.CHAR_EXCLAMATION: return this.readImage(c, start);
      case CC.CHAR_SQUARE_BRACKET_OPEN: return this.readLink(c, start);
      case CC.CHAR_LESS_THAN: return this.readHtml(c, start);
      case CC.CHAR_ASTERISK:
        if (peek === c) return this.readStrong(c, start, 'Strong');

        return this.readEmphasis(c, start);
      case CC.CHAR_UNDERSCORE:
        if (peek === c) return this.readStrong(c, start, 'Strong');

        return this.readEmphasis(c, start);
      case CC.CHAR_TILDE:
        if (peek === CC.CHAR_TILDE) return this.readStrike(c, start);

        return this.readText(c, start);
      default:
        return this.readText(c, start);
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
