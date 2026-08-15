import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

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

async function exportChannel(channelRegex: RegExp, filename: string) {
  const { default: dbConnect } = await import('../src/lib/dbConnect');
  const { default: Story } = await import('../src/models/Story');

  await dbConnect();

  const stories = await Story.find({ channel: channelRegex }).sort({ title: 1 }).lean();

  const rows = stories.map((s) => ({
    Title: s.title || '',
    Writer: s.writer || '',
    Narrator: s.narrator || '',
    'YouTube URL': s.youtubeUrl || (s.youtubeId ? `https://www.youtube.com/watch?v=${s.youtubeId}` : '')
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: ['Title', 'Writer', 'Narrator', 'YouTube URL']
  });

  worksheet['!cols'] = [
    { wch: 45 },
    { wch: 30 },
    { wch: 30 },
    { wch: 50 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stories');

  const outPath = path.join(process.cwd(), filename);
  XLSX.writeFile(workbook, outPath);
  console.log(`Exported ${rows.length} stories to file: ${outPath}`);
}

async function run() {
  await exportChannel(/Sunday\s*Suspense/i, 'Sunday_Suspense_Stories.xlsx');
  await exportChannel(/Goppo\s*Mirer?\s*Thek/i, 'Goppo_Mirer_Thek_Stories.xlsx');
  process.exit(0);
}

run().catch(console.error);
