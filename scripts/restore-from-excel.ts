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

function extractYtId(urlOrId: any): string {
  if (!urlOrId) return '';
  const str = String(urlOrId).trim();
  const match = str.match(/(?:v=|\/embed\/|\/shorts\/|youtu\.be\/|\/v\/|^)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : str;
}

async function run() {
  const { default: dbConnect } = await import('../src/lib/dbConnect');
  const { default: Story } = await import('../src/models/Story');
  const { default: Writer } = await import('../src/models/Writer');
  const { extractNarrators, extractWriters } = await import('../src/lib/youtube-meta');
  const xlsx = await import('xlsx');
  const { default: mongoose } = await import('mongoose');

  await dbConnect();
  console.log('Connected to MongoDB.');

  const xlsxLib = (xlsx as any).default || xlsx;

  // 1. Load CSV 1: Sunday Suspense Stories
  const csv1Path = 'C:\\Users\\User\\Downloads\\Sunday_Suspense_Stories.csv';
  let csv1Data: any[] = [];
  if (fs.existsSync(csv1Path)) {
    const workbook = xlsxLib.readFile(csv1Path);
    csv1Data = xlsxLib.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    console.log(`Loaded ${csv1Data.length} records from Sunday_Suspense_Stories.csv`);
  }

  // 2. Load CSV 2: Goppo Mir Er Thek Stories
  const csv2Path = 'C:\\Users\\User\\Downloads\\goppo mir er thek stories - Sheet1.csv';
  let csv2Data: any[] = [];
  if (fs.existsSync(csv2Path)) {
    const workbook = xlsxLib.readFile(csv2Path);
    csv2Data = xlsxLib.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    console.log(`Loaded ${csv2Data.length} records from goppo mir er thek stories - Sheet1.csv`);
  }

  // 3. Build CSV map keyed by youtubeId
  const csvWriterMap = new Map<string, { writer: string; narrator: string; title: string; source: string }>();

  for (const r of csv1Data) {
    const url = r['YouTube URL'] || r['LINK'] || r['Link'] || r['url'] || r['Url'];
    const ytId = extractYtId(url);
    const writer = (r['Writer'] || r['writer'] || '').toString().trim();
    const narrator = (r['Narrator'] || r['Narrators'] || r['narrator'] || '').toString().trim();
    const title = (r['Title'] || r['title'] || '').toString().trim();
    if (ytId) {
      csvWriterMap.set(ytId, { writer, narrator, title, source: 'Sunday_Suspense_Stories.csv' });
    }
  }

  for (const r of csv2Data) {
    const url = r['LINK'] || r['YouTube URL'] || r['Link'] || r['url'] || r['Url'];
    const ytId = extractYtId(url);
    const writer = (r['Writer'] || r['writer'] || '').toString().trim();
    const narrator = (r['Narrators'] || r['Narrator'] || r['narrator'] || '').toString().trim();
    const title = (r['Title'] || r['title'] || '').toString().trim();
    if (ytId) {
      const existing = csvWriterMap.get(ytId);
      csvWriterMap.set(ytId, {
        writer: writer || (existing?.writer || ''),
        narrator: narrator || (existing?.narrator || ''),
        title: title || (existing?.title || ''),
        source: 'goppo mir er thek stories - Sheet1.csv',
      });
    }
  }

  console.log(`Total unique YouTube IDs in CSV files: ${csvWriterMap.size}`);

  // 4. Fetch all DB stories
  const dbStories = await Story.find({});
  console.log(`Found ${dbStories.length} stories in MongoDB.`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const story of dbStories) {
    const csvItem = csvWriterMap.get(story.youtubeId);
    const fullText = `${story.title} ${story.description || ''}`;
    const calculatedWriter = extractWriters(fullText, story.description || '', story.channel || '');
    const calculatedNarrator = extractNarrators(fullText, story.description || '', story.channel || '');

    let finalWriter = story.writer;
    let finalNarrator = story.narrator;

    // Prefer explicit calculated writer if calculatedWriter is a known specific writer
    if (calculatedWriter && calculatedWriter !== 'Various Writers' && calculatedWriter !== 'Unknown') {
      finalWriter = calculatedWriter;
    } else if (csvItem && csvItem.writer && csvItem.writer !== 'Mir' && csvItem.writer !== 'Mir Afsar Ali') {
      finalWriter = csvItem.writer;
    } else if (calculatedWriter) {
      finalWriter = calculatedWriter;
    }

    if (csvItem && csvItem.narrator) {
      finalNarrator = csvItem.narrator;
    } else if (calculatedNarrator) {
      finalNarrator = calculatedNarrator;
    }

    const updates: Record<string, any> = {};
    if (finalWriter && finalWriter !== story.writer) {
      updates.writer = finalWriter;
    }
    if (finalNarrator && finalNarrator !== story.narrator) {
      updates.narrator = finalNarrator;
    }

    if (Object.keys(updates).length > 0) {
      await Story.findByIdAndUpdate(story._id, updates);
      updatedCount++;
    } else {
      skippedCount++;
    }
  }

  console.log(`\n--- RESTORATION & FIX SUMMARY ---`);
  console.log(`Successfully updated/restored: ${updatedCount} stories in MongoDB`);
  console.log(`Already accurate / skipped: ${skippedCount} stories`);

  // 5. Update Writer model collection in DB with active writers
  const activeWriters = await Story.distinct('writer', { approved: { $ne: false }, writer: { $exists: true, $ne: '' } });
  let newWritersAdded = 0;
  for (const wName of activeWriters) {
    if (!wName || wName === 'Unknown') continue;
    const exists = await Writer.findOne({ name: { $regex: `^${wName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } });
    if (!exists) {
      await Writer.create({ name: wName.trim() });
      newWritersAdded++;
    }
  }
  console.log(`Added ${newWritersAdded} new writer entries to Writer collection.`);

  await mongoose.connection.close();
  console.log('Database restoration completed successfully!');
  process.exit(0);
}

run().catch(async (err) => {
  console.error('Error during restoration:', err);
  process.exit(1);
});
