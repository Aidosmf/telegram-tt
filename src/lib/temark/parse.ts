/* eslint-disable no-console */
/* eslint-disable no-null/no-null */

import type {
  AnyNode,
  Blockquote,
  Code,
  Emphasis,
  Heading,
  Html,
  Image,
  InlineCode,
  Link,
  Paragraph,
  PhrasingContent,
  Root,
  Strike,
  Strong,
  Text,
} from './mdast';
import type { Point } from './unist';

import * as CC from './char-codes';
import { Reader } from './reader';

export type NodeType = AnyNode['type'];

export type Range = [number, number];

type ParseRichTextResult = PhrasingContent | null;

export const NODE_TYPE = {
  EOF: 0,
  Heading: 1,
  Blockquote: 2,
  Code: 3,
  Html: 4,
  Paragraph: 5,
  Root: 6,
  Strike: 7,
  Strong: 8,
  Text: 9,
  Emphasis: 10,
  InlineCode: 11,
  Link: 12,
  Image: 13,
};

export const WHITESPACES = new Set([
  CC.CHAR_SPACE,
  CC.CHAR_TAB,
  CC.CHAR_NEWLINE,
  CC.CHAR_RETURN,
]);

export const RICH_TEXT_DELIMETERS = new Set([
  CC.CHAR_UNDERSCORE,
  CC.CHAR_TILDE,
  CC.CHAR_ASTERISK,
  CC.CHAR_BACKTICK,
  CC.CHAR_SQUARE_BRACKET_OPEN,
  CC.CHAR_EXCLAMATION,
]);

// type StackItem = {
//   value: number;
//   expected: number,
// };

export class Parser {
  private r: Reader;

  private text: string;

  private value: string[] = [];

  private n: AnyNode = {
    type: 'Root',
    children: [],
    position: {
      start: { line: 1, column: 1, offset: 0 },
      end: { line: 1, column: 1, offset: 0 },
    },
    range: [0, 0],
  };

  private stack: string[] = [];

  private parseRichTextBuffer: PhrasingContent[] = [];

  constructor(text: string) {
    this.text = text;
    this.r = new Reader(text);
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

  private createTextNode(
    startPoint: Point,
    endPoint?: Point,
  ): Text {
    const value = this.value.join('');
    const length = value.length;
    this.value = []; // reset

    const endOffset = endPoint ? endPoint.offset : startPoint.offset + length;
    const range: Range = [startPoint.offset, endOffset];

    return {
      type: 'Text',
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
    };
  }

  static createInlineCodeNode(
    startPoint: Point,
    code: string[],
    endPoint: Point,
  ): InlineCode {
    const range: Range = [startPoint.offset, endPoint.offset];

    return {
      type: 'InlineCode',
      value: code.join(''),
      position: {
        start: startPoint,
        end: endPoint,
      },
      range,
    };
  }

  static createParagraphNode(start: Point, end: Point, children: PhrasingContent[] = []): Paragraph {
    const range: Range = [start.offset, end.offset];

    return {
      type: 'Paragraph',
      children,
      position: {
        start,
        end,
      },
      range,
    };
  }

  static createStrikeNode(start: Point, end: Point, children: PhrasingContent[] = []): Strike {
    const range: Range = [start.offset, end.offset];

    return {
      type: 'Strike',
      children,
      position: {
        start,
        end,
      },
      range,
    };
  }

  static createStrongNode(start: Point, end: Point, children: PhrasingContent[] = []): Strong {
    const range: Range = [start.offset, end.offset];

    return {
      type: 'Strong',
      children,
      position: {
        start,
        end,
      },
      range,
    };
  }

  static createEmphasisNode(start: Point, end: Point, children: PhrasingContent[] = []): Emphasis {
    const range: Range = [start.offset, end.offset];

    return {
      type: 'Emphasis',
      children,
      position: {
        start,
        end,
      },
      range,
    };
  }

  static createLinkNode(start: Point, end: Point, children: PhrasingContent[] = [], url?: string): Link {
    const range: Range = [start.offset, end.offset];

    return {
      type: 'Link',
      children,
      url: url || null,
      position: {
        start,
        end,
      },
      range,
    };
  }

  static createImageNode(start: Point, end: Point, url: string, alt: string): Image {
    const range: Range = [start.offset, end.offset];

    return {
      type: 'Image',
      alt,
      url: url.length > 0 ? url : null,
      position: {
        start,
        end,
      },
      range,
    };
  }

  static createRootNode(start: Point, end: Point, children: AnyNode[] = []): Root {
    const range: Range = [start.offset, end.offset];

    return {
      type: 'Root',
      children,
      position: {
        start,
        end,
      },
      range,
    };
  }

  static createBlockquoteNode(start: Point, end: Point, children: PhrasingContent[] = []): Blockquote {
    const range: Range = [start.offset, end.offset];

    return {
      type: 'Blockquote',
      children,
      position: {
        start,
        end,
      },
      range,
    };
  }

  private createCodeNode(
    startPoint: Point,
    endPoint?: Point,
    lang?: string,
  ): Code {
    const value = this.value.join('');
    const length = value.length;
    this.value = []; // reset

    const endOffset = endPoint ? endPoint.offset : startPoint.offset + length;
    const range: Range = [startPoint.offset, endOffset];

    return {
      type: 'Code',
      value,
      lang: lang || null,
      position: {
        start: startPoint,
        end: endPoint || {
          line: startPoint.line,
          column: startPoint.column + length,
          offset: endOffset,
        },
      },
      range,
    };
  }

  static createHeadingNode(
    start: Point,
    end: Point,
    depth: Heading['depth'] = 1,
    children: PhrasingContent[] = [],
  ): Heading {
    const range: Range = [start.offset, end.offset];

    return {
      type: 'Heading',
      children,
      depth,
      position: {
        start,
        end,
      },
      range,
    };
  }

  private createHtmlNode(
    startPoint: Point,
    endPoint?: Point,
    tagName?: string,
    isVoidElement?: boolean,
  ): Html {
    const value = this.value.join('');
    const length = value.length;
    this.value = []; // reset

    const endOffset = endPoint ? endPoint.offset : startPoint.offset + length;
    const range: Range = [startPoint.offset, endOffset];

    return {
      type: 'Html',
      value,
      tagName: tagName || '',
      isVoidElement: isVoidElement || false,
      position: {
        start: startPoint,
        end: endPoint || {
          line: startPoint.line,
          column: startPoint.column + length,
          offset: endOffset,
        },
      },
      range,
    };
  }

  private parseDelimeter(
    c: number,
    start: Point,
    nodeType: PhrasingContent['type'],
  ): PhrasingContent {
    const delimeter = c;
    const delimeterString = String.fromCharCode(delimeter);
    const textBackup: string[] = [];

    textBackup.push(delimeterString);
    let delimeterCount = 1;

    while (c !== -1 && this.r.peek() === delimeter) {
      delimeterCount++;

      if (delimeterCount > 2) {
        const ch = String.fromCharCode(c);
        textBackup.push(ch);
        delimeterCount -= 1;
      }

      c = this.r.next();
    }

    // if there is no openning delimeter
    if (delimeterCount < 2) {
      this.value.push(...textBackup); // push the rest

      return this.createTextNode(start, this.r.getPoint());
    }

    textBackup.push(delimeterString); // push the last delimeter
    const doubledDelimeter = `${delimeterString}${delimeterString}`;

    // successful match
    if (this.stack.length > 0 && this.stack[this.stack.length - 1] === doubledDelimeter) {
      this.stack.pop(); // clear previous delimeter
      return this.createTextNode(start, this.r.getPoint());
    }

    this.stack.push(doubledDelimeter);
    c = this.r.next(); // skip opening delimeter

    const children = this.getRichTextChildren(c, this.r.getPoint());

    if (children.length === 0) {
      this.value.push(...textBackup);
      this.stack.pop(); // open delimeter
      return this.createTextNode(start, this.r.getPoint());
    }

    // unsuccessful match
    if (this.stack.length === 1 && this.stack[this.stack.length - 1] === doubledDelimeter) {
      const openDelimter = this.stack.pop(); // clear previous delimeter
      if (openDelimter === undefined) { throw new Error('Invalid openDelimter retrieve'); }
      if (children.length > 0) { this.parseRichTextBuffer.push(...children); }
      this.value.unshift(doubledDelimeter); // push remaining text delimeter
      return this.createTextNode(start, this.r.getPoint());
    }

    const end = this.r.getPoint();

    // successful match
    if (nodeType === 'Strong') {
      return Parser.createStrongNode(start, end, children);
    } else if (nodeType === 'Strike') {
      return Parser.createStrikeNode(start, end, children);
    } else if (nodeType === 'Emphasis') {
      return Parser.createEmphasisNode(start, end, children);
    } else {
      throw new Error('Invalid nodeType');
    }
  }

  private parseInlineCode(c: number, start: Point): ParseRichTextResult {
    if (c !== CC.CHAR_BACKTICK) {
      throw new Error('Invalid c for parseInlineCode');
    }
    const delimeter = c;
    const delimterString = String.fromCharCode(delimeter);
    const delimeters = [];

    while (c !== -1 && c === delimeter) {
      delimeters.push(delimterString);
      c = this.r.next();
    }

    if (c === -1) {
      this.value.push(...delimeters);
      return this.parseText(c, start);
    }

    if (delimeters.length < 1) {
      this.value.push(...delimeters);
      return this.parseText(c, start);
    }

    const body = [];
    while (c !== -1 && c !== delimeter) {
      body.push(String.fromCharCode(c));
      c = this.r.next();
    }

    if (c !== delimeter) {
      this.value.push(...delimeters);
      this.value.push(body.join(''));
      return this.parseText(c, start);
    }

    c = this.r.next(); // skip closing backtick
    return Parser.createInlineCodeNode(start, body, this.r.getPoint());
  }

  private parseLink(c: number, start: Point): ParseRichTextResult {
    if (c !== CC.CHAR_SQUARE_BRACKET_OPEN) {
      throw new Error('Invalid c for parseLink');
    }

    c = this.r.next(); // skip opening square bracket
    const textStart = this.r.getPoint();

    while (c !== -1 && c !== CC.CHAR_SQUARE_BRACKET_CLOSE) {
      this.value.push(String.fromCharCode(c));
      c = this.r.next();
    }
    const textEnd = this.r.getPoint();

    if (c === -1) return this.createTextNode(textStart, textEnd);
    c = this.r.next(); // skip closing square bracket

    if (c !== CC.CHAR_PARENTHESIS_OPEN) return this.createTextNode(textStart, this.r.getPoint());
    c = this.r.next(); // skip opening parenthesis

    let url = '';
    while (c !== -1 && c !== CC.CHAR_PARENTHESIS_CLOSE) {
      url += String.fromCharCode(c);
      c = this.r.next();
    }

    c = this.r.next(); // skip closing parenthesis

    // TODO: const chilren = this.parseRichText(c, start);
    const chilren = [this.createTextNode(textStart, textEnd)];
    return Parser.createLinkNode(start, this.r.getPoint(), chilren, url);
  }

  private parseImage(c: number, start: Point): ParseRichTextResult {
    if (c !== CC.CHAR_EXCLAMATION) {
      throw new Error('Invalid c for parseImage');
    }

    this.value.push(String.fromCharCode(c)); // push exclamation mark
    c = this.r.next(); // skip opening exclamation mark

    if (c !== CC.CHAR_SQUARE_BRACKET_OPEN) {
      return this.createTextNode(start, this.r.getPoint());
    }

    this.value.push(String.fromCharCode(c)); // push opening square bracket
    c = this.r.next(); // skip opening square bracket

    let alt = '';
    while (c !== -1 && c !== CC.CHAR_SQUARE_BRACKET_CLOSE) {
      alt += String.fromCharCode(c);
      c = this.r.next();
    }

    this.value.push(alt); // push alt text

    if (c === -1) {
      return this.createTextNode(start, this.r.getPoint());
    }

    this.value.push(String.fromCharCode(c)); // push closing square bracket
    c = this.r.next(); // skip closing square bracket

    if (c !== CC.CHAR_PARENTHESIS_OPEN) {
      return this.createTextNode(start, this.r.getPoint());
    }

    this.value.push(String.fromCharCode(c)); // push opening parenthesis
    c = this.r.next(); // skip opening parenthesis

    let url = '';
    while (c !== -1 && c !== CC.CHAR_PARENTHESIS_CLOSE) {
      url += String.fromCharCode(c);
      c = this.r.next();
    }

    this.value.push(url); // push url
    if (c === -1) return this.createTextNode(start, this.r.getPoint());

    this.value = []; // reset, all good
    c = this.r.next(); // skip closing parenthesis

    return Parser.createImageNode(start, this.r.getPoint(), url, alt);
  }

  static returnMergedTextNode(nodeBefore: Text, nodeAfter: Text): Text {
    return {
      type: 'Text',
      value: nodeBefore.value + nodeAfter.value,
      position: {
        start: nodeBefore.position.start,
        end: nodeAfter.position.end,
      },
      range: [nodeBefore.range[0], nodeAfter.range[1]],
    };
  }

  private parseText(c: number, start: Point): ParseRichTextResult {
    while (c !== -1 && !this.r.isEnded && !this.r.isNewLine) {
      if (RICH_TEXT_DELIMETERS.has(c)) {
        const result = this.parseRichText(c, start);

        if (result === null) {
          return this.createTextNode(start, this.r.getPoint());
        } else if (result.type === 'Text') {
          if (this.value.length === 0) return result;

          const nodeBefore = this.createTextNode(start, this.r.getPoint());
          const nodeAfter = result;
          return Parser.returnMergedTextNode(nodeBefore, nodeAfter);
        } else {
          this.parseRichTextBuffer.push(result);
          return this.createTextNode(start, this.r.getPoint());
        }
      }

      const ch = String.fromCharCode(c);
      this.value.push(ch);
      c = this.r.next();
    }

    return this.createTextNode(start, this.r.getPoint());
  }

  private parseRichText(c: number, start: Point): PhrasingContent | null {
    if (c === -1) return null;

    switch (c) {
      case CC.CHAR_UNDERSCORE:
        return this.parseDelimeter(c, start, 'Emphasis');
      case CC.CHAR_TILDE:
        return this.parseDelimeter(c, start, 'Strike');
      case CC.CHAR_ASTERISK: {
        return this.parseDelimeter(c, start, 'Strong');
      } case CC.CHAR_BACKTICK:
        return this.parseInlineCode(c, start);
      case CC.CHAR_SQUARE_BRACKET_OPEN:
        return this.parseLink(c, start);
      case CC.CHAR_EXCLAMATION:
        return this.parseImage(c, start);
      default:
        return this.parseText(c, start);
    }
  }

  private getRichTextChildren(c: number, start: Point): PhrasingContent[] {
    const children: PhrasingContent[] = [];

    while (c !== -1 && c !== CC.CHAR_NEWLINE) {
      const richText = this.parseRichText(c, this.r.getPoint());
      if (richText) children.push(richText);

      if (this.parseRichTextBuffer.length > 0) {
        const child = this.parseRichTextBuffer.pop();
        if (child) children.push(child);
      }

      c = this.r.next();
    }

    return children;
  }

  private readHeading(c: number, start: Point): AnyNode {
    const depth = [];

    while (c !== -1 && c === CC.CHAR_HASH && depth.length < 6) {
      depth.push(String.fromCharCode(c));
      c = this.r.next();
    }

    if (depth.length > 6) {
      this.value.push(depth.join(''));
      return this.readParagraph(c, start);
    }

    if (c === CC.CHAR_SPACE) {
      c = this.r.next();
    } else {
      this.value.push(depth.join(''));
      return this.readParagraph(c, start);
    }

    const children = this.getRichTextChildren(c, this.r.getPoint());
    return Parser.createHeadingNode(start, this.r.getPoint(), depth.length as Heading['depth'], children);
  }

  private readHtml(c: number, start: Point): AnyNode {
    let htmlBlock = '';
    htmlBlock += String.fromCharCode(c); // '<'
    c = this.r.next();

    while (c !== -1 && c !== CC.CHAR_GREATER_THAN) {
      htmlBlock += String.fromCharCode(c);
      c = this.r.next();
    }

    if (c !== -1) {
      htmlBlock += String.fromCharCode(c); // '>'
    }

    if (htmlBlock.startsWith('</')) {
      this.value.push(htmlBlock);
      return this.createTextNode(start, this.r.getPoint());
    }

    let tagName = '';

    for (let i = 1; i < htmlBlock.length; i++) {
      const ch = htmlBlock[i];
      if (ch === ' ' || ch === '\t' || ch === '>' || ch === '/') break;
      tagName += ch;
    }

    const isVoidElement = Parser.isVoidElement(tagName);

    if (htmlBlock.endsWith('/>') || isVoidElement) {
      this.value.push(htmlBlock);
      c = this.r.next();
      const end = this.r.getPoint();
      return this.createHtmlNode(start, end, tagName, true);
    }

    const desiredClosing = `</${tagName}>`;
    let buffer = '';

    while (c !== -1) {
      c = this.r.next();
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

    return this.createHtmlNode(start, this.r.getPoint(), tagName, isVoidElement);
  }

  private readCode(c: number, start: Point): AnyNode {
    const delimeter = c;
    let openDelimeter = String.fromCharCode(delimeter);

    c = this.r.next();

    while (c !== -1 && c === delimeter) {
      openDelimeter += String.fromCharCode(c);
      c = this.r.next();
    }

    let value = '';

    while (c !== -1 && c !== delimeter) {
      value += String.fromCharCode(c);
      c = this.r.next();
    }

    let closeDelimiter = '';

    while (c !== -1 && c === delimeter) {
      closeDelimiter += String.fromCharCode(c);
      c = this.r.next();
    }

    const end = this.r.getPoint();

    if (start.line === end.line) {
      this.value = [openDelimeter, value, closeDelimiter];
      return Parser.createParagraphNode(start, end, [this.createTextNode(start, end)]);
    }

    this.value = [value];
    return this.createCodeNode(start, end);
  }

  // Blockquote: a line starting with '>'
  private readBlockquote(c: number, start: Point): AnyNode {
    this.value.push(String.fromCharCode(c));

    if (this.r.peek() === CC.CHAR_SPACE) {
      c = this.r.next();
      this.value.push(String.fromCharCode(c));
    }

    const children = this.getRichTextChildren(c, this.r.getPoint());
    return Parser.createBlockquoteNode(start, this.r.getPoint(), children);
  }

  private readParagraph(c: number, start: Point): AnyNode {
    const children = this.getRichTextChildren(c, this.r.getPoint());
    const end = children.length > 0 ? children[children.length - 1].position.end : this.r.getPoint();
    return Parser.createParagraphNode(start, end, children);
  }

  private nextNode(c: number): AnyNode | null {
    if (c === -1) return null;

    const start = this.r.getPoint();

    switch (c) {
      case CC.CHAR_HASH: return this.readHeading(c, start);
      case CC.CHAR_GREATER_THAN: return this.readBlockquote(c, start);
      case CC.CHAR_BACKTICK: return this.readCode(c, start);
      case CC.CHAR_LESS_THAN: return this.readHtml(c, start);
      default: return this.readParagraph(c, start);
    }
  }

  public next(): number {
    let c = this.r.next();

    while (Parser.isWhitespace(c)) {
      c = this.r.next();
    }

    if (c === -1) return NODE_TYPE.EOF;

    const node = this.nextNode(c);

    if (node) {
      this.n = node;
      return NODE_TYPE[this.n.type];
    } else {
      return NODE_TYPE.EOF;
    }
  }

  get node(): AnyNode {
    return this.n;
  }

  public parse = (): Root => {
    const children: AnyNode[] = [];

    while (this.next() !== NODE_TYPE.EOF) {
      children.push(this.node);
    }

    return Parser.createRootNode(
      { line: 1, column: 1, offset: 0 },
      this.r.getPoint(),
      children,
    );
  };
}

export function parse(text: string): Root {
  const parser = new Parser(text);

  return parser.parse();
}
