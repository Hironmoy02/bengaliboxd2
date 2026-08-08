import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  for (const line of envConfig.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    }
  }
}

async function run() {
  const { default: dbConnect } = await import('../src/lib/dbConnect');
  const { default: Story } = await import('../src/models/Story');
  const { fetchYouTubeMeta, extractNarrators, extractWriters } = await import('../src/lib/youtube-meta');

  await dbConnect();
  const jibita = await Story.findOne({ title: /Jibita/i });
  if (jibita) {
    console.log('Fetching YouTube metadata for videoId:', jibita.youtubeId);
    const meta = await fetchYouTubeMeta(jibita.youtubeId);
    console.log('Fetched meta description length:', meta.description?.length);

    const desc = meta.description || jibita.description || '';
    const fullTitle = `${jibita.title} ${meta.description ? meta.description.slice(0, 200) : ''}`;
    
    const narrator = extractNarrators(fullTitle, desc, jibita.channel || '');
    const writer = extractWriters(fullTitle, desc, jibita.channel || '');

    console.log('EXTRACTED NARRATOR:', narrator);
    console.log('EXTRACTED WRITER:', writer);

    jibita.narrator = narrator;
    jibita.writer = writer;
    if (meta.description) jibita.description = meta.description.slice(0, 1000);
    await jibita.save();
    console.log('UPDATED JIBITA STORY RECORD SUCCESSFULLY!');
  }
  process.exit(0);
}

run();
