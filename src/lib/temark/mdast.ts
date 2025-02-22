import type { Literal as UnistLiteral, Node as UnistNode, Parent as UnistParent } from './unist';

export type Node = UnistNode;
export type Parent = UnistParent;
export type Literal = UnistLiteral;

/**
 * Example: > text
 *
 * Note: Telegram macOS doesn't support blockquotes, only its own Quotes
 */
export interface Blockquote extends Parent {
  type: 'Blockquote';
  // children: Array<FlowContent>;
  children: Array<PhrasingContent>;
}

/**
 * Example:
 * ----------------
 * ```js
 *    foo()
 * ```
 * ----------------
 */
export interface Code extends Literal {
  type: 'Code';
  lang: string | null;
  value: string;
}

/**
 * aka Italic
 *
 * Example: __text__
 *
 * Note:
 * - Telegram macOS & Web K support double '_'
 */
export interface Emphasis extends Parent {
  type: 'Emphasis';
  children: PhrasingContent[];
}

/**
 * Example: `inline code text`
 */
export interface InlineCode extends Literal {
  type: 'InlineCode';
  value: string;
}

/**
 * Example: [my.telegram.org](https://my.telegram.org)
 */
export interface Link extends Parent {
  type: 'Link';
  url: string | null;
  children: PhrasingContent[];
}

/**
 * Example: ![alpha](https://example.com/favicon.ico)
 */
export interface Image extends Node {
  type: 'Image';
  url: string | null;
  alt: string;
}

/**
 * Example: <div>text</div>
 */
export interface Html extends Literal {
  type: 'Html';
  tagName: string;
  isVoidElement: boolean;
  value: string;
}

/**
 * Example:
 *    paragraph1
 *    paragraph2
 */
export interface Paragraph extends Parent {
  type: 'Paragraph';
  children: PhrasingContent[];
}

/**
 * aka Strikethroug h & Delete
 *
 * Example: ~~text~~
 *
 * Note: Telegram macOS & Web K support double '~'
 */
export interface Strike extends Parent {
  type: 'Strike';
  children: PhrasingContent[];
}

/**
 * aka Bold
 *
 * Example: **text**
 *
 * Note:
 * - Telegram macOS & Web K support double '*'
 */
export interface Strong extends Parent {
  type: 'Strong';
  children: PhrasingContent[];
}

export interface Text extends Literal {
  type: 'Text';
  value: string;
}

/**
 * Example: ### text
 *
 * Note: Telegram macOS & Web K do not support
 */
export interface Heading extends Parent {
  type: 'Heading';
  depth: 1 | 2 | 3 | 4 | 5 | 6;
  children: PhrasingContent[];
}

/**
 * Represents a root document.
 */
export interface Root extends Parent {
  type: 'Root';
  tokens?: Node[];
  children: AnyNode[];
}

export type AnyNode =
  | Root
  | Blockquote
  | Code
  | Emphasis
  | InlineCode
  | Link
  | Image
  | Html
  | Paragraph
  | Strike
  | Strong
  | Text
  | Heading;

export type ParentNode =
  | Root
  | Blockquote
  | Emphasis
  | Link
  | Paragraph
  | Strike
  | Strong
  | Heading;

export type LiteralNode =
  | Code
  | Text
  | InlineCode
  | Image
  | Html;

export type PhrasingContent = Emphasis | Html | InlineCode | Link | Strong | Text | Strike | Image;

export type FlowContent = Blockquote | Code | Heading | Html | Content;

export type Content = Paragraph;
