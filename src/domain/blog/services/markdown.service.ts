import { marked, type Tokens } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import { createHighlighter } from 'shiki';

let highlighter: Awaited<ReturnType<typeof createHighlighter>> | null = null;

async function getHighlighter() {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: [
        'javascript',
        'typescript',
        'jsx',
        'tsx',
        'css',
        'html',
        'bash',
        'json',
        'markdown',
        'yaml',
        'python',
        'sql',
        'go',
        'rust',
      ],
    });
  }
  return highlighter;
}

export class MarkdownService {
  async toHtml(markdown: string): Promise<string> {
    const highlighter = await getHighlighter();

    const renderer = new marked.Renderer();
    let headingIndex = 0;

    renderer.code = ({ text, lang }) => {
      if (lang && highlighter) {
        const html = highlighter.codeToHtml(text, {
          lang,
          themes: {
            light: 'github-light',
            dark: 'github-dark',
          },
        });
        return html;
      }
      return `<pre><code>${text}</code></pre>`;
    };

    renderer.heading = ({ tokens, depth }) => {
      const text = this.parseTokens(tokens);
      const id = `heading-${headingIndex++}`;
      return `<h${depth} id="${id}">${text}</h${depth}>\n`;
    };

    marked.use({ renderer });
    const html = await marked.parse(markdown);
    return DOMPurify.sanitize(html);
  }

  private parseTokens(tokens: Tokens.Generic[]): string {
    return tokens
      .map((token) => {
        if ('text' in token) {
          return token.text;
        }
        return '';
      })
      .join('');
  }
}

export const markdownService = new MarkdownService();
