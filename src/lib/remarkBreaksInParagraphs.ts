import type { Plugin } from 'unified';
import type { Root, Paragraph, Text, Break } from 'mdast';
import { visit } from 'unist-util-visit';

/**
 * Convert soft line breaks inside Markdown paragraphs into hard `<br>` breaks.
 *
 * Unlike `remark-breaks`, this only affects plain paragraphs so it does not
 * break list item parsing, headings, code blocks, tables, etc.
 */
const remarkBreaksInParagraphs: Plugin<[], Root> = () => (tree) => {
  visit(tree, 'paragraph', (paragraph: Paragraph) => {
    const nextChildren: Array<Text | Break | (typeof paragraph.children)[number]> = [];

    for (const child of paragraph.children) {
      if (child.type !== 'text' || !/[\r\n]/.test(child.value)) {
        nextChildren.push(child);
        continue;
      }

      const parts = child.value.split(/\r?\n/);
      parts.forEach((part, index) => {
        // Preserve whitespace-only segments so intentional blank lines inside
        // a paragraph remain as spacing between consecutive breaks.
        nextChildren.push({ type: 'text', value: part });
        if (index < parts.length - 1) {
          nextChildren.push({ type: 'break' });
        }
      });
    }

    paragraph.children = nextChildren;
  });
};

export default remarkBreaksInParagraphs;
