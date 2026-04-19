const CN_CHARS_PER_MIN = 380;
const EN_WORDS_PER_MIN = 220;

export function readingTime(text: string): { minutes: number; words: number; label: string } {
  const cnChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const latinText = text.replace(/[\u4e00-\u9fff]/g, ' ');
  const enWords = latinText.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(cnChars / CN_CHARS_PER_MIN + enWords / EN_WORDS_PER_MIN));
  return { minutes, words: cnChars + enWords, label: `约 ${minutes} 分钟` };
}
