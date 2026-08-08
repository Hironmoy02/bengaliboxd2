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
  console.log('Connected to MongoDB.');

  const stories = await Story.find({
    $or: [
      { description: '' },
      { description: { $exists: false } },
      { narrator: 'Unknown' },
      { narrator: 'Mir' },
      { writer: 'Unknown' },
      { writer: 'Various Writers' },
    ],
  });

  console.log(`Found ${stories.length} stories to inspect and fix.`);
  let fixedCount = 0;

  for (const story of stories) {
    let videoDesc = story.description || '';
    if (!videoDesc && story.youtubeId) {
      try {
        const meta = await fetchYouTubeMeta(story.youtubeId);
        if (meta.description) videoDesc = meta.description;
      } catch {
        /* ignore fetch error */
      }
    }

    const fullText = `${story.title} ${videoDesc}`;
    const newNarrator = extractNarrators(fullText, videoDesc, story.channel || '');
    const newWriter = extractWriters(fullText, videoDesc, story.channel || '');

    const updates: Record<string, any> = {};
    if (videoDesc && videoDesc !== story.description) {
      updates.description = videoDesc.slice(0, 1000);
    }
    if (newNarrator && newNarrator !== story.narrator) {
      updates.narrator = newNarrator;
    }
    if (newWriter && newWriter !== story.writer) {
      updates.writer = newWriter;
    }

    if (Object.keys(updates).length > 0) {
      await Story.findByIdAndUpdate(story._id, updates);
      console.log(`Updated [${story.title}]: Narrator => "${newNarrator}", Writer => "${newWriter}"`);
      fixedCount++;
    }
  }

  console.log(`Finished processing. Updated ${fixedCount} stories with complete YouTube metadata!`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
