export function sanitizeText(text: string): string {
  let result = text
    .replace(/\u2014/g, '-')   // Em dash
    .replace(/\u2013/g, '-')   // En dash
    .replace(/\u2018/g, "'")   // Left single quote
    .replace(/\u2019/g, "'")   // Right single quote
    .replace(/\u201C/g, '"')   // Left double quote
    .replace(/\u201D/g, '"')   // Right double quote
    .replace(/\u2026/g, '...') // Ellipsis
    .replace(/\u00A0/g, ' ')   // Non-breaking space
    .replace(/\u2022/g, '*');  // Bullet

  // Remove emojis and special Unicode
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2300}-\u{23FF}]|[\u{25A0}-\u{25FF}]|[\u{1F000}-\u{1F02F}]|[\u{FE00}-\u{FE0F}]|[\u{200D}]/gu;
  result = result.replace(emojiRegex, '');

  // Clean up multiple spaces
  result = result.replace(/\s+/g, ' ');

  return result.trim();
}
