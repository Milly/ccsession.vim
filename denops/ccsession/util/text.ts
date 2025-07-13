/** Unicode ellipsis character */
const ELLIPSIS = "\u2026";

export function truncateText(
  text: string,
  limit: number = 80,
): string {
  if (text.length <= limit) {
    return text;
  }
  return text.substring(0, limit) + ELLIPSIS;
}
