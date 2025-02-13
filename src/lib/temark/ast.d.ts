// "@types/hast" in package.json was a hint? ;)

/**
 * A node that contains other nodes.
 */
export interface Node {
  type: string;
  position: Position;
}

/**
 * A node that contains other nodes.
 */
export interface Parent extends Node {
  children: Node[];
}

/**
 * A node with a value
 */
export interface Literal<Value = unknown> extends Node {
  value: Value;
}

/**
 * Location information for a node.
 */
export interface Position {
  start: Point;
  end: Point;
  indent?: number;
}

/**
 * A point in the text document.
 */
export interface Point {
  line: number;
  column: number;
  offset: number;
}
