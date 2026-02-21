
/**
 * Utility: sanitizeScriptContent
 * Removes potentially dangerous HTML to minimize XSS risk.
 * We use DOMPurify for robust sanitization. If not installed yet, fallback to a minimal method.
 */
let DOMPurify: any = null;
try {
  // Lazy load DOMPurify if available (works with ESM builds)
  // @ts-ignore
  DOMPurify = require('dompurify');
} catch {}

export function sanitizeScriptContent(content: string): string {
  if (DOMPurify) {
    // Clean with DOMPurify and then remove markdown
    let cleaned = DOMPurify.sanitize(content, { USE_PROFILES: { html: true } });
    return removeMarkdownArtifacts(cleaned);
  }
  
  // Fallback: Remove script/style, event-handlers, and markdown
  let cleaned = content
    .replace(/<script.*?>.*?<\/script>/gi, '')
    .replace(/on\w+=".*?"/gi, '')
    .replace(/javascript:/gi, '');
  
  return removeMarkdownArtifacts(cleaned);
}

function removeMarkdownArtifacts(content: string): string {
  return content
    // Remove markdown formatting
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // Remove **bold**
    .replace(/\*([^*]+)\*/g, '$1')      // Remove *italic*
    .replace(/#{1,6}\s*/g, '')          // Remove ## headers
    .replace(/^[\s-]*\*\s+/gm, '')      // Remove bullet points
    .replace(/^[\s-]*-\s+/gm, '')       // Remove dashes
    .replace(/```[\s\S]*?```/g, '')     // Remove code blocks
    .replace(/`([^`]+)`/g, '$1')        // Remove inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
    .replace(/\n\s*\n\s*\n/g, '\n\n')  // Normalize multiple line breaks
    .replace(/^\s+|\s+$/g, '')          // Trim whitespace
    .replace(/\s+/g, ' ')               // Normalize spaces
    .trim();
}
