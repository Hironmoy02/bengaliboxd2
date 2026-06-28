'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector } from '@/lib/hooks';
import api from '@/lib/axios';
import { CHANNELS, GENRES, NARRATOR_KEYWORDS, DEFAULT_CHANNEL, DEFAULT_GENRE, matchYouTubeChannel, SUGGESTED_TAGS, formatDuration } from '@/lib/constants';
import {
  Box, Typography, Button, Paper, Stack, TextField, IconButton, InputAdornment,
  Autocomplete, Chip,
} from '@mui/material';
import YouTubeIcon from '@mui/icons-material/YouTube';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';
import { AppAlert, AppLoadingState, AppYearPicker } from '@/components/ui';

function getErrorMessage(err: unknown): string { return err instanceof Error ? err.message : 'An error occurred'; }

export default function AddStoryPage() {
  const { user, loading } = useAppSelector((s) => s.auth);
  const router = useRouter();

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState(DEFAULT_CHANNEL);
  const [narrator, setNarrator] = useState('');
  const [genre, setGenre] = useState(DEFAULT_GENRE);
  const [writer, setWriter] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [yearPublished, setYearPublished] = useState('');
  const [duration, setDuration] = useState<number>(0);
  const [tags, setTags] = useState<string[]>([]);
  const [writers, setWriters] = useState<{ _id: string; name: string }[]>([]);

  const [isFetchingYoutube, setIsFetchingYoutube] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    api.get('/api/writers').then(({ data }) => setWriters(data.writers || [])).catch(() => {});
  }, []);

  const handleFetchYoutube = async () => {
    if (!youtubeUrl) { setError('Enter a YouTube URL first'); return; }
    setError(''); setSuccess(''); setIsFetchingYoutube(true);
    try {
      const { data } = await api.get('/api/youtube-fetch', { params: { url: youtubeUrl } });
      setTitle(data.title);
      const matchedChannel = matchYouTubeChannel(data.channel || '');
      setChannel(matchedChannel || 'Other Bengali Channels');
      setDescription(data.description || '');
      setThumbnailUrl(data.thumbnailUrl || '');
      if (data.yearPublished) setYearPublished(String(data.yearPublished));
      if (data.duration) setDuration(data.duration);
      const t = data.title.toLowerCase();
      const matchedNarrator = Object.entries(NARRATOR_KEYWORDS).find(([kw]) => t.includes(kw));
      setNarrator(matchedNarrator ? matchedNarrator[1] : '');
      setSuccess('Successfully fetched YouTube story details!');
    } catch (err) { setError(getErrorMessage(err) || 'Failed to query YouTube API'); }
    finally { setIsFetchingYoutube(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !channel || !youtubeUrl || !narrator) { setError('Fill out all required fields'); return; }
    setError(''); setSuccess(''); setIsSubmitting(true);
    try {
      if (writer.trim()) {
        const trimmed = writer.trim();
        if (!writers.some((w) => w.name.toLowerCase() === trimmed.toLowerCase())) {
          try {
            const { data } = await api.post('/api/writers', { name: trimmed });
            if (data.writer) setWriters((prev) => [...prev, data.writer].sort((a, b) => a.name.localeCompare(b.name)));
          } catch { /* already exists */ }
        }
      }
      const { data } = await api.post('/api/stories', { title, channel, youtubeUrl, narrator, genre, writer, description, thumbnailUrl, yearPublished, duration: duration || undefined, tags });
      setSuccess(data.message || 'Story submitted!');
      setYoutubeUrl(''); setTitle(''); setNarrator(''); setWriter(''); setYearPublished(''); setDescription(''); setThumbnailUrl(''); setDuration(0); setTags([]);
    } catch (err) { setError(getErrorMessage(err) || 'Error saving story.'); }
    finally { setIsSubmitting(false); }
  };

  if (loading || !user) return <AppLoadingState message="Loading..." fullScreen />;

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', px: 2, py: 5, minHeight: '80vh' }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Suggest a Story</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Submit a Bengali audio story from YouTube. Only stories from Sunday Suspense, Goppo Mirer Thek, Midnight Horror Station, and Kahon are accepted. It will appear in the catalog after admin approval.
      </Typography>

      {error && <AppAlert severity="error" message={error} onClose={() => setError('')} />}
      {success && <AppAlert severity="success" message={success} onClose={() => setSuccess('')} />}

      <Paper sx={{ p: 3, mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
          <YouTubeIcon sx={{ color: 'error.main' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>YouTube Video Link</Typography>
        </Stack>
        <Stack direction="row" spacing={1}>
          <TextField fullWidth size="small" placeholder="https://www.youtube.com/watch?v=..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
          <Button variant="outlined" onClick={handleFetchYoutube} disabled={isFetchingYoutube} startIcon={isFetchingYoutube ? <RefreshIcon className="spin-animation" /> : <UploadFileIcon />}>
            {isFetchingYoutube ? 'Fetching...' : 'Fetch'}
          </Button>
        </Stack>
        {duration > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Duration auto-detected: <strong>{formatDuration(duration)}</strong>
          </Typography>
        )}
      </Paper>

      <form onSubmit={handleSubmit}>
        <Stack spacing={2.5}>
          <TextField fullWidth label="Story Title *" placeholder="e.g. Sunday Suspense | The Hound of the Baskervilles" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select slotProps={{ select: { native: true } }} label="Channel *" value={channel} onChange={(e) => setChannel(e.target.value)} required sx={{ flex: 1 }}>
              {CHANNELS.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
            </TextField>
            <TextField select slotProps={{ select: { native: true } }} label="Genre *" value={genre} onChange={(e) => setGenre(e.target.value)} required sx={{ flex: 1 }}>
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </TextField>
          </Stack>
          <TextField fullWidth label="Narrator(s) *" placeholder="e.g. Somak, Mir, Deep" value={narrator} onChange={(e) => setNarrator(e.target.value)} required />
          <Autocomplete
            freeSolo
            options={writers.map((w) => w.name)}
            value={writer}
            onInputChange={(_, newValue) => setWriter(newValue || '')}
            onChange={async (_, newValue) => {
              if (newValue && !writers.some((w) => w.name.toLowerCase() === newValue.toLowerCase())) {
                try {
                  const { data } = await api.post('/api/writers', { name: newValue });
                  if (data.writer) setWriters((prev) => [...prev, data.writer].sort((a, b) => a.name.localeCompare(b.name)));
                } catch { /* already exists */ }
              }
            }}
            renderInput={(params) => <TextField {...params} label="Writer / Author" placeholder="Type to search or add new writer..." fullWidth />}
            fullWidth
          />
          <AppYearPicker
            value={yearPublished}
            onChange={(y) => setYearPublished(y === 'All' ? '' : y)}
            label="Year Published on YouTube"
          />
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Tags (optional)</Typography>
            <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
              {SUGGESTED_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant={tags.includes(tag) ? 'filled' : 'outlined'}
                  color={tags.includes(tag) ? 'primary' : 'default'}
                  onClick={() => setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 10 ? [...prev, tag] : prev)}
                  sx={{ borderColor: 'divider' }}
                />
              ))}
            </Stack>
          </Box>
          <TextField fullWidth multiline rows={4} label="Description" placeholder="Optional story synopsis..." value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button type="submit" variant="contained" fullWidth size="large" startIcon={<SendIcon />} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Story Suggestion'}
          </Button>
        </Stack>
      </form>
    </Box>
  );
}
