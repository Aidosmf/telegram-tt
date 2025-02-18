import type { Token } from './tokens';
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
  type: 'blockquote';
  children: Array<FlowContent>;
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
  type: 'code';
  lang: string | null;
}

/**
 * aka Italic
 *
 * Example: *text* or _text_ (standard)
 *
 * Note:
 * - Telegram macOS & Web K support double '_'
 */
export interface Emphasis extends Parent {
  type: 'emphasis';
  children: PhrasingContent[];
}

/**
 * Example: ```inline code text```
 */
export interface InlineCode extends Literal {
  type: 'inlineCode';
}

/**
 * Example: [my.telegram.org](https://my.telegram.org)
 */
export interface Link extends Parent {
  type: 'link';
  url: string;
  children: PhrasingContent[];
}

/**
 * Example: <div>text</div>
 */
export interface Html extends Literal {
  type: 'html';
}

/**
 * Example:
 *    paragraph1
 *    paragraph2
 */
export interface Paragraph extends Parent {
  type: 'paragraph';
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
  type: 'strike';
  children: PhrasingContent[];
}

/**
 * aka Bold
 *
 * Example: **text** or __text__
 *
 * Note:
 * - Telegram macOS & Web K support double '*'
 */
export interface Strong extends Parent {
  type: 'strong';
  children: PhrasingContent[];
}

export interface Text extends Literal {
  type: 'text';
}

/**
 * Example: ### text
 *
 * Note: Telegram macOS & Web K do not support
 */
export interface Heading extends Parent {
  type: 'heading';
  depth: 1 | 2 | 3 | 4 | 5 | 6;
  children: PhrasingContent[];
}

/**
 * Represents a root document.
 */
export interface Root extends Parent {
  type: 'root';
  tokens?: Token[];
  children: AnyNode[];
}

export type AnyNode =
  | Blockquote
  | Code
  | Emphasis
  | InlineCode
  | Link
  | Html
  | Paragraph
  | Strike
  | Strong
  | Text
  | Heading;

export type PhrasingContent = Emphasis | Html | InlineCode | Link | Strong | Text | Strike;

export type FlowContent = Blockquote | Code | Heading | Html | Content;

export type Content = Paragraph;
