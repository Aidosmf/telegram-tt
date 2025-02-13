import type { Literal, Node, Parent } from './ast';

/**
 * Example: > text
 */
export interface Blockquote extends Parent {
  type: 'blockquote';
}

/**
 * Example:
 * ----------------
 * paragraph1
 *
 * paragraph1
 * ----------------
 */
export interface Break extends Node {
  type: 'break';
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
  lang?: string;
}

/**
 * aka Italic
 *
 * Examle: *text* or _text_
 */
export interface Emphasis extends Parent {
  type: 'emphasis';
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
}

/**
 * Example: ~~text~~
 */
export interface Delete extends Parent {
  type: 'delete';
}

/**
 * Represents a root document.
 */
export interface Root extends Parent {
  type: 'root';
}

/**
 * aka Bold
 *
 * Example: **text** or __text__
 */
export interface Strong extends Parent {
  type: 'strong';
}

export interface Text extends Literal {
  type: 'text';
}
