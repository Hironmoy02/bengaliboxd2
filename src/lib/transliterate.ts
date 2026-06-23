import { transliterate } from 'transliteration';

export function toSearchable(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  const hasBengali = /[\u0980-\u09FF]/.test(trimmed);
  if (!hasBengali) return trimmed.toLowerCase();
  return transliterate(trimmed).toLowerCase();
}
