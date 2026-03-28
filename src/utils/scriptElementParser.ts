
import { v4 as uuid } from "uuid";

export interface ScriptElement {
  id: string;
  script_id: string;
  type: 'action' | 'character' | 'dialogue' | 'heading' | 'parenthetical' | 'transition';
  content: string;
  position: number;
}

export const parseScriptElements = (scriptContent: string): ScriptElement[] => {
  const lines = scriptContent.split('\n');
  const elements: ScriptElement[] = [];
  let position = 0;
  let hasBlankLineBefore = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      hasBlankLineBefore = true;
      continue;
    }

    // IGNORE KNOWN PLACEHOLDER ARTIFACTS (AI Hallucinated labels)
    const lowerLine = line.toLowerCase().replace(/[^\w\s]/g, ''); // Remove punctuation for matching
    if (
      lowerLine === 'character name' ||
      lowerLine === 'character dialogue' ||
      lowerLine === 'scene description or action' ||
      lowerLine === 'paren' ||
      lowerLine === 'parenthetical' ||
      lowerLine === 'dialogue' ||
      lowerLine === 'action' ||
      lowerLine === 'heading' ||
      lowerLine === 'transition' ||
      lowerLine.includes('fade in or intext location') ||
      lowerLine.includes('handoff protocol') ||
      lowerLine.includes('tagging system') ||
      lowerLine === 'example' ||
      lowerLine === '' ||
      line === '---' ||
      line.match(/^\((PAREN|PARENTHETICAL|DIALOGUE|ACTION|HEADING|TRANS|CHARACTER)\)$/i)
    ) {
      continue;
    }

    let elementType: ScriptElement['type'] = 'action';
    let content = line;

    // 0. TAG-BASED HANDOFF PROTOCOL (Preferred)
    if (line.match(/^\[(SCENE|HEADING)\]/i)) {
      elementType = 'heading';
      content = formatSceneHeading(line.replace(/^\[(SCENE|HEADING)\]/i, ''));
    } else if (line.match(/^\[(CHAR|CHARACTER)\]/i)) {
      elementType = 'character';
      content = formatCharacterName(line.replace(/^\[(CHAR|CHARACTER)\]/i, ''));
    } else if (line.match(/^\[(DIALOGUE|DIALOG)\]/i)) {
      elementType = 'dialogue';
      content = formatDialogue(line.replace(/^\[(DIALOGUE|DIALOG)\]/i, ''));
    } else if (line.match(/^\[ACTION\]/i)) {
      elementType = 'action';
      content = formatActionLine(line.replace(/^\[ACTION\]/i, ''));
    } else if (line.match(/^\[(PAREN|PARENTHETICAL)\]/i)) {
      elementType = 'parenthetical';
      content = line.replace(/^\[(PAREN|PARENTHETICAL)\]/i, '').trim();
      if (content && !content.startsWith('(')) content = `(${content}`;
      if (content && !content.endsWith(')')) content = `${content})`;
    } else if (line.match(/^\[(TRANS|TRANSITION)\]/i)) {
      elementType = 'transition';
      content = line.replace(/^\[(TRANS|TRANSITION)\]/i, '').toUpperCase().trim();
    }

    // 1. REGEX FALLBACK (for backward compatibility/legacy lines)
    // Transitions (should be checked first) - more comprehensive patterns
    else if (line.match(/^(FADE IN:|FADE OUT\.|THE END|CUT TO:|DISSOLVE TO:|SMASH CUT TO:|MATCH CUT TO:|WIPE TO:|IRIS IN:|IRIS OUT:)$/i)) {
      elementType = 'transition';
      content = line.toUpperCase();
    }
    // Scene headings
    else if (line.match(/^(INT\.|EXT\.|INTERIOR|EXTERIOR)\s+.+\s*-\s*(DAY|NIGHT|MORNING|AFTERNOON|EVENING|DAWN|DUSK|CONTINUOUS|LATER|SAME TIME)/i)) {
      elementType = 'heading';
      content = formatSceneHeading(line);
    }
    else if (line.match(/^(INT\.|EXT\.|INTERIOR|EXTERIOR)\s+/i)) {
      elementType = 'heading';
      content = formatSceneHeading(line);
    }
    else if (line.startsWith('(') && line.endsWith(')') && line.length > 2) {
      elementType = 'parenthetical';
      content = line;
    }
    else if (isCharacterName(line, lines, i)) {
      elementType = 'character';
      content = formatCharacterName(line);
    }
    // If previous element is Character or Parenthetical, this MUST be Dialogue
    // Even if there is a blank line before it, because Characters must speak!
    else if (elements.length > 0 &&
      (elements[elements.length - 1]?.type === 'character' || elements[elements.length - 1]?.type === 'parenthetical') &&
      !isLikelyNewElement(line)) {
      elementType = 'dialogue';
      content = formatDialogue(line);
    }
    // Dialogue continuation (following another dialogue line without a blank line break)
    else if (!hasBlankLineBefore && elements.length > 0 &&
      elements[elements.length - 1]?.type === 'dialogue' &&
      !isLikelyNewElement(line)) {
      elementType = 'dialogue';
      content = formatDialogue(line);
    }
    else {
      elementType = 'action';
      content = formatActionLine(line);
    }

    elements.push({
      id: uuid(),
      script_id: '',
      type: elementType,
      content: content.trim(),
      position: position++
    });

    // Reset the blank line tracker since we just pushed a valid element
    hasBlankLineBefore = false;
  }

  // Final cleanup: filter out any elements with empty content
  return elements.filter(el => el.content.length > 0);
};

const isCharacterName = (line: string, lines: string[], currentIndex: number): boolean => {
  // A Character name in Fountain strictly follows these rules:
  // 1. Must be ALL CAPS.
  // 2. Can include numbers, spaces, hyphens, and parenthesis for extensions like (V.O.) or (PHONE).
  // 3. Must NOT end with standard sentence punctuation (. ? !).
  // 4. Must NOT be a scene heading or transition.
  // 5. Must have dialogue or parenthetical following it.

  if (line.length > 60) return false;

  // Must be strictly uppercase characters, numbers, spaces, and allowed symbols. It can end in parenthesis.
  if (!line.match(/^[A-Z0-9\s\-\.\'()]+$/)) return false;

  // Exclude scene headings and transitions
  if (line.match(/^(INT\.|EXT\.|INTERIOR|EXTERIOR|FADE|CUT TO|DISSOLVE|WIPE TO|IRIS)/i)) return false;

  // A true character name almost NEVER ends in a period, question mark, or exclamation point.
  // This prevents ALL-CAPS shouted dialogue like "MARCUS. I JUST SAW YOUR NOTE." from being parsed as Character.
  if (line.match(/[\.\?\!]$/)) return false;

  // Check if followed by dialogue or parenthetical (skipping any blank lines)
  let nextIndex = currentIndex + 1;
  while (nextIndex < lines.length && lines[nextIndex].trim().length === 0) {
    nextIndex++;
  }

  if (nextIndex < lines.length) {
    const nextLine = lines[nextIndex].trim();
    if (nextLine.length > 0) {
      // Must not be a scene heading or transition
      if (nextLine.match(/^(INT\.|EXT\.|FADE|CUT TO|DISSOLVE)/i)) return false;
      return true;
    }
  }

  return true; // Last line of the script and matches all-caps
};

const isLikelyCharacterName = (line: string): boolean => {
  return line.length < 60 &&
    line.match(/^[A-Z0-9\s\-\.\'()]+$/) !== null &&
    !line.match(/[\.\?\!]$/) &&
    !line.match(/^(INT\.|EXT\.|FADE|CUT TO|DISSOLVE)/i);
};

const isLikelyNewElement = (line: string): boolean => {
  // Check if this line is likely the start of a new script element
  return line.match(/^(INT\.|EXT\.|FADE|CUT TO|DISSOLVE)/i) !== null ||
    isLikelyCharacterName(line) ||
    line.startsWith('(') && line.endsWith(')');
};

// Formatting functions for professional screenplay standards
const formatSceneHeading = (line: string): string => {
  let formatted = line.toUpperCase().trim();

  // Ensure proper scene heading format
  if (formatted.match(/^(INT\.|EXT\.)\s+/)) {
    // Already properly formatted
    return formatted;
  } else if (formatted.match(/^(INTERIOR|EXTERIOR)\s+/)) {
    // Convert to standard abbreviations
    formatted = formatted.replace(/^INTERIOR/, 'INT.');
    formatted = formatted.replace(/^EXTERIOR/, 'EXT.');
  }

  return formatted;
};

const formatCharacterName = (line: string): string => {
  let formatted = line.toUpperCase().trim();

  // Remove any trailing colons or other punctuation
  formatted = formatted.replace(/[:\.\,\;]+$/, '');

  return formatted;
};

const formatDialogue = (line: string): string => {
  let formatted = line.trim();

  // Remove quotation marks if present
  formatted = formatted.replace(/^["']|["']$/g, '');

  // Remove ALL formatting from dialogue content - dialogue should be plain text
  formatted = formatted
    .replace(/\*\*([^*]+)\*\*/g, '$1')    // Remove **bold**
    .replace(/\*([^*]+)\*/g, '$1')        // Remove *italic*
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1') // Remove _underline_
    .replace(/`([^`]+)`/g, '$1')          // Remove `code`
    .replace(/#{1,6}\s*/g, '')            // Remove # headers
    .replace(/^\s*[-*+]\s+/gm, '')        // Remove bullet points
    .trim();

  return formatted;
};

const formatActionLine = (line: string): string => {
  let formatted = line.trim();

  // Action lines should be in present tense, brief descriptions
  return formatted;
};

// Content validation and cleanup
export const validateAndCleanContent = (content: string): string => {
  let cleaned = content;

  // Remove any remaining markdown artifacts - comprehensive cleaning
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');     // Remove **bold**
  cleaned = cleaned.replace(/\*([^*]+)\*\*/g, '$1');         // Remove *italic*
  cleaned = cleaned.replace(/_{1,2}([^_]+)_{1,2}/g, '$1'); // Remove _underline_
  cleaned = cleaned.replace(/#{1,6}\s*/g, '');             // Remove # headers
  cleaned = cleaned.replace(/^[\s-]*\*\s+/gm, '');         // Remove bullet points
  cleaned = cleaned.replace(/^[\s-]*-\s+/gm, '');          // Remove dashes
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');        // Remove code blocks
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');           // Remove inline code
  cleaned = cleaned.replace(/~~([^~]+)~~/g, '$1');         // Remove ~~strikethrough~~
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Remove [links](url)

  // Clean up spacing
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
};
