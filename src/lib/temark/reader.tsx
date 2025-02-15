import type { Point } from './unist';

import { CHAR_NEWLINE, CHAR_RETURN } from './char-codes';

export class Reader {
  /**
   * The text to read from.
   */
  private text = '';

  /**
   * The current line number.
   */
  private line = 1;

  /**
   * The current column number.
   */
  private column = 0;

  /**
   * The current offset in the text.
   */
  private offset = -1;

  /**
   * The last character code read.
   */
  private last = -1;

  /**
   * Whether the last character read was a new line.
   */
  public isNewLine = false;

  /**
   * Whether the Reader has ended.
   */
  public isEnded = false;

  /**
   * Creates a new instance.
   */
  constructor(text: string) {
    this.text = text;
  }

  /**
   * Ends the Reader.
   */
  private end(): void {
    if (this.isEnded) return;

    this.column++;
    this.offset++;
    this.last = -1;
    this.isEnded = true;
  }

  /**
   * @returns the current Point in the Reader
   */
  public getPoint(): Point {
    return {
      line: this.line,
      column: this.column,
      offset: this.offset,
    };
  }

  /**
   * @returns the next character code, or -1 if there are no more characters.
   */
  public next(): number {
    if (this.offset >= this.text.length - 1) {
      this.end();
      return -1;
    }

    this.offset++;
    const charCode = this.text.charCodeAt(this.offset);

    if (this.isNewLine) {
      this.line++;
      this.column = 1;
      this.isNewLine = false;
    } else {
      this.column++;
    }

    if (charCode === CHAR_RETURN) {
      this.isNewLine = true;

      if (this.peek() === CHAR_NEWLINE) {
        this.offset++;
      }
    } else if (charCode === CHAR_NEWLINE) {
      this.isNewLine = true;
    }

    this.last = charCode;

    return charCode;
  }

  /**
   * @returns the next character code, or -1 if there are no more characters.
   */
  public peek(): number {
    if (this.offset === this.text.length - 1) {
      return -1;
    }

    return this.text.charCodeAt(this.offset + 1);
  }

  /**
   * @param fn - A function to call on the next character.
   * @returns True if the next character code matches, false if not.
   */
  public match(fn: (charCode: number) => boolean): boolean {
    if (fn(this.peek())) {
      this.next();
      return true;
    }

    return false;
  }

  /**
   * @returns the last character code read.
   */
  public curr() {
    return this.last;
  }
}
