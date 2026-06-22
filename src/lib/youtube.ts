const YOUTUBE_ID_REGEXP = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;

export function getYouTubeId(url: string): string | null {
  const match = url.match(YOUTUBE_ID_REGEXP);
  return match && match[2].length === 11 ? match[2] : null;
}
