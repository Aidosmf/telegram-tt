import type { AnyNode } from './mdast';

import { visit } from './visit';

export const stringify = (root: AnyNode): string => {
  const text: string[] = [];

  visit(root, {
    enter(node, parent) {
      switch (node.type) {
        case 'Image':
          text.push('![', node.alt, '](', node.url || '', ')');
          return;
        case 'Heading': {
          const heading = `${'#'.repeat(node.depth)} `;
          text.push(heading);
          return;
        } case 'Code':
          text.push(`\`\`\`${node.lang || ''}`);
          text.push('\n');
          text.push(node.value);
          return;
        case 'Link':
          text.push('[');
          return;
        case 'Text':
          text.push(node.value);

          switch (parent?.type) {
            case 'Blockquote':
              text.push('\n');
              break;
            default:
              break;
          }

          return;
        case 'InlineCode':
          text.push('`');
          return;
        case 'Html':
          text.push(node.value);
          break;
        case 'Blockquote':
          text.push('>');
          break;
        case 'Strike':
          text.push('~~');
          break;
        case 'Strong':
          text.push('**');
          break;
        case 'Emphasis':
          text.push('_');
          break;
        default:
          break;
      }
    },
    exit(node) {
      switch (node.type) {
        case 'Paragraph':
        case 'Html':
        case 'Heading':
          text.push('\n\n');
          return;
        case 'Code':
          text.push('```');
          text.push('\n\n');
          return;
        case 'InlineCode':
          text.push('`');
          break;
        case 'Link':
          text.push(']');

          if (node.children.length) {
            text.push('(');
            text.push(node.url || '');
            text.push(')');
          }

          break;
        case 'Strike':
          text.push('~~');
          break;
        case 'Strong':
          text.push('**');
          break;
        case 'Emphasis':
          text.push('_');
          break;
        default:
          break;
      }
    },
  });

  return text.join('');
};
