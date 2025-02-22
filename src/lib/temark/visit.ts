import type { AnyNode as Node, ParentNode as Parent } from './mdast';

// TODO: adjust types so other Unist specs would be supported

/**
* Traverses an AST from the given node.
*/
export function visit(root: Node, visitor: {
  enter: (node: Node, parent?: Parent) => void;
  exit: (node: Node, parent?: Parent) => void;
}): void {
  function visitNode(node: Node, parent?: Parent) {
    if (typeof visitor.enter === 'function') {
      visitor.enter(node, parent);
    }

    switch (node.type) {
      case 'Root':
      case 'Blockquote':
      case 'Emphasis':
      case 'Link':
      case 'Paragraph':
      case 'Strike':
      case 'Strong':
      case 'Heading':
        node.children.forEach((child) => {
          visitNode(child, node);
        });
        break;
      case 'Code':
      case 'Text':
      case 'InlineCode':
      case 'Image':
      case 'Html':
      default:
        break;
    }

    if (typeof visitor.exit === 'function') {
      visitor.exit(node, parent);
    }
  }

  visitNode(root);
}
