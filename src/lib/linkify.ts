const URL_REGEX = /https?:\/\/[^\s<]+/g;

export interface LinkPart {
  type: 'text' | 'link';
  content: string;
}

export function linkifyText(text: string): LinkPart[] {
  const parts: LinkPart[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_REGEX)) {
    if (match.index! > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'link', content: match[0] });
    lastIndex = match.index! + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts;
}
