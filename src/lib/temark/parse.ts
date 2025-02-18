/* eslint-disable no-null/no-null */
import type {
  AnyNode,
  Blockquote,
  Code,
  Emphasis,
  FlowContent,
  Html,
  InlineCode,
  Link,
  Paragraph,
  PhrasingContent,
  Root,
  Strike,
  Strong,
  Text,
} from './mdast';

import { type Token, TOKEN_TYPE as TT, Tokenizer } from './tokens';

export type Options = {
  /**
   * default `true`
   */
  tokens: boolean;
};

export const DEFAULT_OPTIONS: Options = {
  tokens: true,
};

export class Parser {
  private text: string;

  private tokenizer: Tokenizer;

  private tokens: Token[] = [];

  private options: Options = DEFAULT_OPTIONS;

  constructor(text: string, options: Partial<Options> = {}) {
    this.text = text;
    this.tokenizer = new Tokenizer(text);
    this.options = Object.freeze({
      ...this.options,
      ...options,
    });
  }

  public parse(): Root {
    const children: AnyNode[] = [];

    let tokenType = this.tokenizer.next();
    while (tokenType !== TT.EOF) {
      const token = this.tokenizer.token;
      const node = Parser.parseValue(token);

      children.push(node);

      this.tokens.push(token);
      tokenType = this.tokenizer.next();
    }

    const lastChild = children[children.length - 1];

    const position = {
      start: {
        line: 1,
        column: 1,
        offset: 0,
      },
      end: lastChild ? lastChild.position.end : {
        line: 1,
        column: 1,
        offset: 0,
      },
    };

    const tokensParts = this.options.tokens ? { tokens: this.tokens } : {};

    return {
      type: 'root',
      children,
      position,
      ...tokensParts,
    };
  }

  static parseValue(token: Token): AnyNode {
    switch (token.type) {
      case 'Blockquote': return Parser.parseBlockquote(token);
      case 'Code': return Parser.parseCode(token);
      case 'Emphasis': return Parser.parseParagraph(token);
      case 'Heading': return Parser.parseParagraph(token); // Telegram Messenger doesn't support Headings yet
      case 'Html': return Parser.parseHtml(token);
      case 'Image': return Parser.parseParagraph(token); // Telegram Messenger doesn't support Image Markdown yet
      case 'InlineCode': return Parser.parseParagraph(token);
      case 'Strike': return Parser.parseParagraph(token);
      case 'Strong': return Parser.parseParagraph(token);
      case 'Link': return Parser.parseParagraph(token);
      default: return Parser.parseParagraph(token);
    }
  }

  static parseBlockquote(token: Token, idx: number = 0): Blockquote {
    const { value, position } = token;
    const children: FlowContent[] = [];

    for (let i = idx; i < value.length; i++) {
      const char = value[i];

      if (char === '>') {
        children.push(Parser.parseBlockquote(token, i + 1));
      } else if (char === '\n') {
        children.push(Parser.parseParagraph({
          type: 'Text',
          value: value.slice(idx, i),
          position: {
            start: position.start,
            end: {
              line: position.start.line + 1,
              column: 1,
              offset: position.start.offset + i,
            },
          },
          range: [idx, i],
        }));
      }
    }

    return {
      type: 'blockquote',
      children,
      position,
    };
  }

  static parseParagraph(token: Token): Paragraph {
    const children: PhrasingContent[] = [];

    switch (token.type) {
      case 'Emphasis': children.push(Parser.parseEmphasis(token)); break;
      case 'InlineCode': children.push(Parser.parseInlineCode(token)); break;
      case 'Strike': children.push(Parser.parseStrike(token)); break;
      case 'Strong': children.push(Parser.parseStrong(token)); break;
      case 'Link': children.push(Parser.parseLink(token)); break;
      default: children.push(Parser.parseText(token)); break;
    }

    return {
      type: 'paragraph',
      children,
      position: token.position,
    };
  }

  static parseText(token: Token): Text {
    return {
      type: 'text',
      value: token.value,
      position: token.position,
    };
  }

  static parseEmphasis(token: Token, idx: number = 0): Emphasis {
    return {
      type: 'emphasis',
      // TODO: support nested PhrasingContent
      children: [Parser.parseText({
        type: 'Text',
        value: token.value,
        position: token.position,
        range: [idx, token.value.length],
      })],
      position: token.position,
    };
  }

  static parseInlineCode(token: Token, idx: number = 0): InlineCode {
    const { value, position } = token;

    const end = value.indexOf('`', idx);
    const code = value.slice(idx, end);

    return {
      type: 'inlineCode',
      value: code,
      position,
    };
  }

  static parseLink(token: Token): Link {
    const { value, position } = token;
    const text = [];
    const url: string[] = [];
    const currPosition = { ...position };

    let i = 0;
    while (i < value.length) {
      const char = value[i];

      if (char === '[') {
        const end = value.indexOf(']', i);
        text.push(value.slice(i + 1, end));
        i = end;
      } else if (char === '(') {
        const end = value.indexOf(')', i);
        url.push(value.slice(i + 1, end));
        i = end;
      }

      currPosition.start.column++;
      i++;
    }

    const textValue = text.join('');
    const children: PhrasingContent[] = [
      // TODO: support nested PhrasingContent
      Parser.parseText({
        type: 'Text',
        value: textValue,
        position: {
          start: position.start,
          end: {
            line: position.start.line,
            column: position.start.column + value.length,
            offset: position.start.offset + value.length,
          },
        },
        range: [position.start.offset, position.start.offset + value.length],
      }),
    ];

    return {
      type: 'link',
      url: url.join(''),
      children,
      position,
    };
  }

  static parseStrike(token: Token, idx: number = 0): Strike {
    return {
      type: 'strike',
      // TODO: support nested PhrasingContent
      children: [Parser.parseText({
        type: 'Text',
        value: token.value,
        position: token.position,
        range: [idx, token.value.length],
      })],
      position: token.position,
    };
  }

  static parseStrong(token: Token, idx: number = 0): Strong {
    return {
      type: 'strong',
      // TODO: support nested PhrasingContent
      children: [Parser.parseText({
        type: 'Text',
        value: token.value,
        position: token.position,
        range: [idx, token.value.length],
      })],
      position: token.position,
    };
  }

  static parseHtml(token: Token): Html {
    return {
      type: 'html',
      value: token.value,
      position: token.position,
    };
  }

  static parseCode(token: Token): Code {
    const { value, position } = token;
    const lang: string[] = [];

    let i = 0;
    while (i < value.length) {
      const char = value[i];

      if (char !== '\n') {
        lang.push(char);
        i++;
      } else {
        break;
      }
    }

    return {
      type: 'code',
      lang: lang.length > 0 ? lang.join('') : null,
      value: value.substring(i + 1),
      position,
    };
  }
}

export function parse(text: string, ops: Partial<Options> = {}): Root {
  const parser = new Parser(text, ops);

  return parser.parse();
}
