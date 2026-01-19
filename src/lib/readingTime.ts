export function getReadingTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  const minTime = Math.max(1, minutes - 1);
  const maxTime = minutes + 1;
  return `${minTime}-${maxTime} min read`;
}
