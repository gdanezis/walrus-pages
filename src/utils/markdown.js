/**
 * Markdown Renderer Module - Parse and sanitize Markdown content
 */

import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked for better rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

export function renderMarkdown(markdown) {
  // Parse markdown to HTML
  const rawHtml = marked.parse(markdown);
  
  // Sanitize to prevent XSS
  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
      'a', 'img', 'ul', 'ol', 'li', 'blockquote',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr', 'div', 'span'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
  });
  
  return cleanHtml;
}

export function extractTitle(markdown) {
  // Extract first heading as title
  const lines = markdown.split('\n');
  for (const line of lines) {
    const match = line.match(/^#{1,6}\s+(.+)$/);
    if (match) {
      return match[1].trim();
    }
  }
  return 'Untitled';
}
