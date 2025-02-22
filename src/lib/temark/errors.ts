/* eslint-disable max-classes-per-file */

import type { Point } from './unist';

/**
 * Base class that attaches location to an error.
 */
export class ErrorWithLocation extends Error {
  line: number;

  column: number;

  offset: number;

  constructor(message: string, { line, column, offset }: Point) {
    super(`${message} (${line}:${column})`);

    this.line = line;

    this.column = column;

    this.offset = offset;
  }
}
