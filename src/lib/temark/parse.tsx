/* eslint-disable no-null/no-null */
import type {
  AnyNode,
  Blockquote,
  Code,
  Heading,
  Html,
  Paragraph,
  PhrasingContent,
  Root,
} from './mdast';

import { ParseRichText } from './parse-rich-text';
import {
  type Token,
  TOKEN_TYPE as TT,
  type TokenCode,
  type TokenHeading,
  type TokenHtml,
  Tokenizer,
} from './tokens';

export type Options = {
  /**
   * default `false`
   */
  tokens: boolean;
};

export const DEFAULT_OPTIONS: Options = {
  tokens: false,
};

export class Parser {
  private tokenizer: Tokenizer;

  private tokens: Token[] = [];

  private options: Options = DEFAULT_OPTIONS;

  public text: string = '';

  constructor(text: string, options: Partial<Options> = {}) {
    this.tokenizer = new Tokenizer(text);
    this.text = text;
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
      const node = Parser.parseToken(token);

      children.push(node);

      this.tokens.push(token);
      tokenType = this.tokenizer.next();
    }

    const lastChild = children[children.length - 1];

    const rootPosition = {
      start: {
        line: 1,
        column: 1,
        offset: 0,
      },
      end: lastChild ? { ...lastChild.position.end } : {
        line: 1,
        column: 1,
        offset: 0,
      },
    };

    const tokensParts = this.options.tokens ? { tokens: this.tokens } : {};

    return {
      type: 'root',
      children,
      position: rootPosition,
      ...tokensParts,
    };
  }

  static parseToken(token: Token): AnyNode {
    switch (token.type) {
      case 'Blockquote': return Parser.parseBlockquote(token);
      case 'Code': return Parser.parseCode(token);
      case 'Heading': return Parser.parseHeading(token);
      case 'Html': return Parser.parseHtml(token);
      case 'Paragraph': return Parser.parseParagraph(token);
      default: return Parser.parseParagraph(token);
    }
  }

  static parseBlockquote(token: Token): Blockquote {
    const { value, position } = token;

    // TODO: parse FlowContent
    const children: PhrasingContent[] = [
      {
        type: 'text',
        value,
        position,
      },
    ];

    return {
      type: 'blockquote',
      children,
      position,
    };
  }

  static parseHeading(token: TokenHeading): Heading {
    const { value, position, depth } = token;

    return {
      type: 'heading',
      depth: (depth ?? 1) as Heading['depth'],
      // TODO: parse rich text
      children: [{
        type: 'text',
        value,
        position,
      }],
      position,
    };
  }

  static parseCode(token: TokenCode): Code {
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

  static parseHtml(token: TokenHtml): Html {
    const { value, position, tagName } = token;

    return {
      type: 'html',
      value,
      tagName: tagName ?? '',
      isVoidElement: token.isVoidElement || false,
      position,
    };
  }

  static parseParagraph(token: Token): Paragraph {
    const { value, position } = token;

    const richTextParser = new ParseRichText(value, position.start);

    return {
      type: 'paragraph',
      children: richTextParser.parse(),
      position,
    };
  }
}

export function parse(text: string, ops: Partial<Options> = {}): Root {
  const parser = new Parser(text, ops);

  return parser.parse();
}
