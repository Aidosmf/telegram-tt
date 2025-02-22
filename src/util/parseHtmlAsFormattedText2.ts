import type { ApiFormattedText, ApiMessageEntity, ApiMessageEntityTextUrl } from '../api/types';
import { ApiMessageEntityTypes } from '../api/types';

import { RE_LINK_TEMPLATE } from '../config';
import { parse as parseMarkdown, type Root, stringify, visit as traverseAst } from '../lib/temark';
import { AnyNode, Html as HtmlNode, Link as LinkNode } from '../lib/temark/mdast';

export const ENTITY_CLASS_BY_NODE_NAME: Record<string, ApiMessageEntityTypes> = {
  B: ApiMessageEntityTypes.Bold,
  STRONG: ApiMessageEntityTypes.Bold,
  I: ApiMessageEntityTypes.Italic,
  EM: ApiMessageEntityTypes.Italic,
  INS: ApiMessageEntityTypes.Underline,
  U: ApiMessageEntityTypes.Underline,
  S: ApiMessageEntityTypes.Strike,
  STRIKE: ApiMessageEntityTypes.Strike,
  DEL: ApiMessageEntityTypes.Strike,
  CODE: ApiMessageEntityTypes.Code,
  PRE: ApiMessageEntityTypes.Pre,
  BLOCKQUOTE: ApiMessageEntityTypes.Blockquote,
};

/**
 * TODO: handle IS_EMOJI_SUPPORTED, withMarkdownLinks, skipMarkdown, MAX_TAG_DEEPNESS
 */
export default function parseHtmlAsFormattedText(
  html: string, withMarkdownLinks = false, skipMarkdown = false,
): ApiFormattedText {
  const ast = parseMarkdown(html);

  // const text = stringify(ast); // if there would be a Markdown API
  return getFormattedText(ast);
}

function getFormattedText(astRoot: Root): {
  text: string;
  entities: ApiMessageEntity[] | undefined;
} {
  const text: string[] = [];
  const entities: ApiMessageEntity[] = [];

  // const { index, entity } = getEntityDataFromNode(node, text, textIndex);

  traverseAst(astRoot, {
    enter(node, parent) {
      const { value, entity } = getEntityDataFromNode(node);
      if (entity) entities.push(entity);
      if (value.length > 0) text.push(value);
    },
    exit() {
      // do nothing for now
    },
  });

  console.log('MF', 'text:', text);
  console.log('MF', 'entities:', entities);

  return {
    text: text.join(''),
    entities: entities.length ? entities : undefined,
  };
}

export function fixImageContent(fragment: HTMLDivElement) {
  fragment.querySelectorAll('img').forEach((node) => {
    if (node.dataset.documentId) { // Custom Emoji
      node.textContent = (node as HTMLImageElement).alt || '';
    } else { // Regular emoji with image fallback
      node.replaceWith(node.alt || '');
    }
  });
}

export function parseMarkdownLinks(html: string) {
  return html.replace(new RegExp(`\\[([^\\]]+?)]\\((${RE_LINK_TEMPLATE}+?)\\)`, 'g'), (_, text, link) => {
    const url = link.includes('://') ? link : link.includes('@') ? `mailto:${link}` : `https://${link}`;
    return `<a href="${url}">${text}</a>`;
  });
}

function getEntityDataFromNode(
  node: AnyNode,
): { value: string; entity: ApiMessageEntity | undefined } {
  switch (node.type) {
    // get from parent instead
    case 'Text': return { value: node.value, entity: undefined };
    case 'Link': return getEntityFromLinkNode(node);
    case 'Html': return getEntityFromHtmlNode(node);
    case 'Strong': {
      const value = node.children.find((child) => child.type === 'Text')?.value || '';

      return {
        value,
        entity: {
          type: ApiMessageEntityTypes.Bold,
          offset: node.position.start.offset,
          length: node.position.end.offset - node.position.start.offset,
        },
      };
    }
    case 'Strike': {
      const value = node.children.find((child) => child.type === 'Text')?.value || '';

      return {
        value,
        entity: {
          type: ApiMessageEntityTypes.Strike,
          offset: node.position.start.offset,
          length: node.position.end.offset - node.position.start.offset,
        },
      };
    }
    case 'Emphasis': {
      const value = node.children.find((child) => child.type === 'Text')?.value || '';

      return {
        value,
        entity: {
          type: ApiMessageEntityTypes.Italic,
          offset: node.position.start.offset,
          length: node.position.end.offset - node.position.start.offset,
        },
      };
    }
    case 'InlineCode': {
      return {
        value: node.value,
        entity: {
          type: ApiMessageEntityTypes.Code,
          offset: node.position.start.offset,
          length: node.position.end.offset - node.position.start.offset,
        },
      };
    }
    case 'Code': {
      return {
        value: node.value,
        entity: {
          type: ApiMessageEntityTypes.Pre,
          offset: node.position.start.offset,
          length: node.position.end.offset - node.position.start.offset,
        },
      };
    }
    default: {
      return {
        value: '', entity: undefined,
      };
    }
  }
}

function getEntityFromLinkNode(node: LinkNode): { value: string; entity: ApiMessageEntityTextUrl } {
  const link = node.url;
  const textNode = node.children.find((child) => child.type === 'Text');
  const value = textNode ? textNode.value : '';
  const offset = node.position.start.offset;
  const length = node.position.end.offset - offset;

  return {
    value,
    entity: {
      type: ApiMessageEntityTypes.TextUrl,
      offset,
      length,
      url: link || '',
    },
  };
}

// TODO: parse html and return entity
function getEntityFromHtmlNode(node: HtmlNode): { value: string; entity: undefined } {
  const entityClass = ENTITY_CLASS_BY_NODE_NAME[node.tagName];
  if (!entityClass) return { value: '', entity: undefined };

  switch (node.tagName) {
    case 'pre':
    case 'code':
    case 'blockquote':
    case 'span':
    case 'img':
      return {
        value: '',
        entity: undefined,
      };
  }

  return {
    value: '',
    entity: undefined,
  };
}
