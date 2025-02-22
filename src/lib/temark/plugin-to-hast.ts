import type { AnyNode, Html as HtmlNode } from './mdast';

import { visit } from './visit';

// stolen from ParseHtmlAsFormattedText.ts
function parseMarkdownLinks(html: string) {
  return html.replace(new RegExp(`\\[([^\\]]+?)]\\((${RE_LINK_TEMPLATE}+?)\\)`, 'g'), (_, text, link) => {
    const url = link.includes('://') ? link : link.includes('@') ? `mailto:${link}` : `https://${link}`;
    return `<a href="${url}">${text}</a>`;
  });
}

/**
 * Converts a Markdown AST (MDAST) nodes to HTML AST (HAST) nodes.
 * @param root - The root node.
 *
 * TODO: convert to a HAST node and create a "fromHtml" stringifier for it.
 */
export const transformToHtml = (root: AnyNode): Root => {
  visit(root, {
    enter(node, parent) {
      switch (node.type) {
        case 'Image':
          return;
        case 'Heading':
          return;
        case 'Code':
          return;
        case 'Link':
          return;
        case 'Text':
          return;
        case 'InlineCode':
          return;
        case 'Html':
          return;
        case 'Blockquote':
          return;
        case 'Strike':
          return;
        case 'Strong':
          return;
        case 'Emphasis':
          return;
        default:
          break;
      }
    },
  });
};
