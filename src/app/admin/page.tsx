'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/lib/hooks';
import api from '@/lib/axios';
import {
  Box, Typography, Button, Paper, Stack, TextField, Tab, Tabs, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Avatar, Chip, IconButton, Switch, FormGroup,
  FormControlLabel, Divider, Card, CardContent, InputAdornment, TextareaAutosize,
  Autocomplete,
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import CheckIcon from '@mui/icons-material/Check';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import YouTubeIcon from '@mui/icons-material/YouTube';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
  AppAlert, AppConfirmModal, AppLoadingState, AppEmptyState,
} from '@/components/ui';
import { CHANNELS, GENRES, CHANNEL_KEYWORDS, NARRATOR_KEYWORDS, DEFAULT_CHANNEL, DEFAULT_GENRE, ADMIN_TAB_LABELS, YEARS_RANGE, YOUTUBE_THUMBNAIL } from '@/lib/constants';

interface Story { _id: string; title: string; channel: string; narrator: string; genre: string; writer?: string; youtubeId: string; youtubeUrl: string; approved: boolean; }
interface UserProfile { _id: string; username: string; email: string; role: string; createdAt: string; }
interface TrafficStat { date: string; visitors: number; }
interface AdminStats { totalUsers: number; adminUsers: number; approvedStories: number; pendingStories: number; totalReviews: number; }

function getErrorMessage(err: unknown): string { return err instanceof Error ? err.message : 'An error occurred'; }

export default function AdminPage() {
  const { user, loading } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState('Sunday Suspense');
  const [narrator, setNarrator] = useState('');
  const [genre, setGenre] = useState('Horror');
  const [writer, setWriter] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [writers, setWriters] = useState<{ _id: string; name: string }[]>([]);
  const [yearPublished, setYearPublished] = useState('');

  const [isFetchingYoutube, setIsFetchingYoutube] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [traffic, setTraffic] = useState<TrafficStat[]>([]);
  const [pendingStories, setPendingStories] = useState<Story[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [allowUserSubmissions, setAllowUserSubmissions] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; action: () => void; severity: 'error' | 'warning' }>({ open: false, title: '', message: '', action: () => { }, severity: 'warning' });

  const [editSearch, setEditSearch] = useState('');
  const [editResults, setEditResults] = useState<Story[]>([]);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [editForm, setEditForm] = useState({ title: '', channel: '', narrator: '', genre: '', writer: '', description: '', thumbnailUrl: '', yearPublished: '', youtubeUrl: '' });
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const channelsList = [...CHANNELS];
  const genresList = [...GENRES];

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  const fetchStats = async () => {
    if (!user || user.role !== 'admin') return;
    setLoadingStats(true);
    try { const { data } = await api.get('/api/admin/stats'); setStats(data.metrics); setTraffic(data.traffic || []); }
    catch { console.error('Failed to load stats'); }
    finally { setLoadingStats(false); }
  };

  const fetchPendingStories = async () => {
    if (!user || user.role !== 'admin') return;
    setLoadingPending(true);
    try { const { data } = await api.get('/api/stories', { params: { status: 'pending' } }); setPendingStories(data.stories || []); }
    catch { console.error('Failed to load pending stories'); }
    finally { setLoadingPending(false); }
  };

  const fetchUsers = async () => {
    if (!user || user.role !== 'admin') return;
    setLoadingUsers(true);
    try { const { data } = await api.get('/api/admin/users'); setUsersList(data.users || []); }
    catch { console.error('Failed to load users'); }
    finally { setLoadingUsers(false); }
  };

  const fetchSettings = async () => {
    if (!user || user.role !== 'admin') return;
    setLoadingSettings(true);
    try { const { data } = await api.get('/api/admin/settings'); setAllowUserSubmissions(data.settings.allowUserSubmissions); }
    catch { console.error('Failed to load settings'); }
    finally { setLoadingSettings(false); }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    if (activeTab === 0) fetchStats();
    if (activeTab === 1) fetchPendingStories();
    if (activeTab === 2) fetchUsers();
    if (activeTab === 5) fetchSettings();
  }, [activeTab, user]);

  useEffect(() => { if (user && user.role !== 'admin') setActiveTab(3); }, [user]);

  useEffect(() => {
    api.get('/api/writers').then(({ data }) => setWriters(data.writers || [])).catch(() => { });
  }, []);

  const handleFetchYoutube = async () => {
    if (!youtubeUrl) { setError('Enter a YouTube URL first'); return; }
    setError(''); setSuccess(''); setIsFetchingYoutube(true);
    try {
      const { data } = await api.get('/api/youtube-fetch', { params: { url: youtubeUrl } });
      setTitle(data.title);
      const fc = data.channel.toLowerCase();
      const matchedChannel = Object.entries(CHANNEL_KEYWORDS).find(([, keywords]) =>
        keywords.some((kw) => fc.includes(kw))
      );
      setChannel(matchedChannel ? matchedChannel[0] : 'Other Bengali Channels');
      setDescription(data.description || '');
      setThumbnailUrl(data.thumbnailUrl || '');
      if (data.yearPublished) setYearPublished(String(data.yearPublished));
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
          } catch { /* writer already exists or error */ }
        }
      }
      const { data } = await api.post('/api/stories', { title, channel, youtubeUrl, narrator, genre, writer, description, thumbnailUrl, yearPublished });
      setSuccess(data.message || 'Story added!');
      setYoutubeUrl(''); setTitle(''); setNarrator(''); setWriter(''); setYearPublished(''); setDescription(''); setThumbnailUrl('');
      if (user?.role === 'admin') fetchStats();
    } catch (err) { setError(getErrorMessage(err) || 'Error saving story.'); }
    finally { setIsSubmitting(false); }
  };

  const handleApproveStory = async (storyId: string) => {
    setConfirmModal({
      open: true, title: 'Approve Story', message: 'This story will be published to the public lobby.', severity: 'warning', action: async () => {
        setError(''); setSuccess(''); setActionInProgress(storyId);
        try { const { data } = await api.post(`/api/stories/${storyId}/approve`); setSuccess(data.message); fetchPendingStories(); }
        catch (err) { setError(getErrorMessage(err) || 'Failed to approve story'); }
        finally { setActionInProgress(null); setConfirmModal((p) => ({ ...p, open: false })); }
      }
    });
  };

  const handleRejectStory = async (storyId: string) => {
    setConfirmModal({
      open: true, title: 'Reject & Delete Story', message: 'This will permanently delete this story suggestion. This action cannot be undone.', severity: 'error', action: async () => {
        setError(''); setSuccess(''); setActionInProgress(storyId);
        try { const { data } = await api.delete(`/api/stories/${storyId}/approve`); setSuccess(data.message); fetchPendingStories(); }
        catch (err) { setError(getErrorMessage(err) || 'Failed to delete story'); }
        finally { setActionInProgress(null); setConfirmModal((p) => ({ ...p, open: false })); }
      }
    });
  };

  const handlePromoteUser = async (targetUserId: string, username: string) => {
    setConfirmModal({
      open: true, title: 'Promote to Admin', message: `Promote '${username}' to Admin? They will have full admin access.`, severity: 'warning', action: async () => {
        setError(''); setSuccess(''); setActionInProgress(targetUserId);
        try { const { data } = await api.post('/api/admin/users', { userId: targetUserId }); setSuccess(data.message); fetchUsers(); }
        catch (err) { setError(getErrorMessage(err) || 'Failed to promote user'); }
        finally { setActionInProgress(null); setConfirmModal((p) => ({ ...p, open: false })); }
      }
    });
  };

  const handleToggleSubmissions = async () => {
    setSavingSettings(true);
    try { const newValue = !allowUserSubmissions; const { data } = await api.put('/api/admin/settings', { allowUserSubmissions: newValue }); setAllowUserSubmissions(data.settings.allowUserSubmissions); setSuccess(`User submissions ${newValue ? 'enabled' : 'disabled'}`); }
    catch (err) { setError(getErrorMessage(err) || 'Failed to update settings'); }
    finally { setSavingSettings(false); }
  };

  const handleSearchStories = async () => {
    if (!editSearch.trim()) return;
    setLoadingEdit(true);
    try {
      const { data } = await api.get('/api/stories', { params: { search: editSearch, status: 'all', limit: 50 } });
      setEditResults(data.stories || []);
    } catch { console.error('Failed to search stories'); }
    finally { setLoadingEdit(false); }
  };

  const handleSelectStoryForEdit = (story: Story) => {
    setEditingStory(story);
    setEditForm({
      title: story.title,
      channel: story.channel,
      narrator: story.narrator,
      genre: story.genre,
      writer: story.writer || '',
      description: '',
      thumbnailUrl: '',
      yearPublished: '',
      youtubeUrl: story.youtubeUrl || '',
    });
  };

  const handleUpdateStory = async () => {
    if (!editingStory) return;
    setSavingEdit(true);
    try {
      const payload: Record<string, string> = {};
      if (editForm.title) payload.title = editForm.title;
      if (editForm.channel) payload.channel = editForm.channel;
      if (editForm.narrator) payload.narrator = editForm.narrator;
      if (editForm.genre) payload.genre = editForm.genre;
      if (editForm.writer !== undefined) payload.writer = editForm.writer;
      if (editForm.yearPublished) payload.yearPublished = editForm.yearPublished;
      if (editForm.youtubeUrl) payload.youtubeUrl = editForm.youtubeUrl;
      const { data } = await api.put(`/api/stories/${editingStory._id}`, payload);
      setSuccess(data.message || 'Story updated!');
      setEditingStory(null);
      handleSearchStories();
    } catch (err) { setError(getErrorMessage(err) || 'Failed to update story'); }
    finally { setSavingEdit(false); }
  };

  const filteredUsers = usersList.filter((u) => u.username.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()));

  if (loading || !user) return <AppLoadingState message="Loading admin panel..." fullScreen />;

  const isAdmin = user.role === 'admin';
  const tabLabels = [...ADMIN_TAB_LABELS];

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2, py: 5, minHeight: '80vh' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
          {isAdmin ? 'Admin Console' : 'Contributor Desk'}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {isAdmin ? 'Manage audio stories, review submissions, and view analytics.' : 'Suggest and submit audio stories to keep the catalog up to date!'}
        </Typography>
      </Box>

      {error && <AppAlert severity="error" message={error} onClose={() => setError('')} />}
      {success && <AppAlert severity="success" message={success} onClose={() => setSuccess('')} />}

      {isAdmin && (
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 4, borderBottom: '1px solid rgba(255,255,255,0.08)', '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.9rem', minHeight: 48 } }}>
          {tabLabels.map((label, i) => <Tab key={i} label={label} />)}
        </Tabs>
      )}

      {/* Tab 0: Analytics */}
      {isAdmin && activeTab === 0 && (
        loadingStats ? <AppLoadingState message="Loading analytics..." /> : stats && (
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {[
                { label: 'Active Users', value: stats.totalUsers, icon: <PeopleIcon />, color: 'primary.main' },
                { label: 'Admins', value: stats.adminUsers, icon: <PeopleIcon />, color: 'success.main' },
                { label: 'Stories in Lobby', value: stats.approvedStories, icon: <BarChartIcon />, color: '#f59e0b' },
                { label: 'Pending Approvals', value: stats.pendingStories, icon: <CheckCircleOutlinedIcon />, color: 'error.main' },
              ].map((card) => (
                <Card key={card.label} sx={{ flex: 1, borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Box sx={{ color: card.color, mb: 1 }}>{card.icon}</Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>{card.label}</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800, mt: 0.5 }}>{card.value}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
            <Paper sx={{ p: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Traffic (Last 7 Days)</Typography>
              <Stack spacing={1}>
                {traffic.map((day) => (
                  <Stack key={day.date} direction="row" spacing={2} sx={{ alignItems: 'center', py: 1, px: 2, borderRadius: 1, background: 'rgba(255,255,255,0.02)' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 100 }}>{day.date}</Typography>
                    <Box sx={{ height: 8, width: Math.min(day.visitors * 15, 200), background: 'primary.main', borderRadius: 1 }} />
                    <Typography variant="caption" color="text.secondary">{day.visitors} visits</Typography>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          </Stack>
        )
      )}

      {/* Tab 1: Approvals */}
      {isAdmin && activeTab === 1 && (
        loadingPending ? <AppLoadingState message="Loading pending stories..." /> : pendingStories.length === 0 ? (
          <AppEmptyState title="All clear!" message="No pending story submissions waiting for approval." />
        ) : (
          <Stack spacing={2}>
            {pendingStories.map((story) => (
              <Paper key={story._id} sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', border: '1px solid rgba(255,255,255,0.06)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={YOUTUBE_THUMBNAIL(story.youtubeId)} alt="" style={{ width: 160, aspectRatio: '16/9', objectFit: 'cover', borderRadius: 8 }} />
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Chip label={story.channel} size="small" color="primary" variant="outlined" sx={{ mb: 0.5 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{story.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Narrator: {story.narrator} &bull; Genre: {story.genre}{story.writer && <>&bull; Writer: {story.writer}</>}
                  </Typography>
                  <Button size="small" href={story.youtubeUrl} target="_blank" startIcon={<OpenInNewIcon sx={{ fontSize: 12 }} />} sx={{ mt: 0.5, textTransform: 'none' }}>
                    Play on YouTube
                  </Button>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" size="small" startIcon={<CheckIcon />} onClick={() => handleApproveStory(story._id)} disabled={actionInProgress !== null}>
                    {actionInProgress === story._id ? 'Working...' : 'Approve'}
                  </Button>
                  <IconButton color="error" onClick={() => handleRejectStory(story._id)} disabled={actionInProgress !== null}>
                    <DeleteOutlinedIcon />
                  </IconButton>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )
      )}

      {/* Tab 2: Users */}
      {isAdmin && activeTab === 2 && (
        <Paper sx={{ p: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Registered Users</Typography>
            <TextField size="small" placeholder="Search..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} sx={{ width: 240 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment> } }} />
          </Stack>
          {loadingUsers ? <AppLoadingState message="Loading users..." /> : filteredUsers.length === 0 ? (
            <AppEmptyState title="No users found" message="Try a different search query." />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Username</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} className="hide-mobile">Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 600 }} className="hide-mobile">Joined</TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell><Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 11 }}>{u.username[0].toUpperCase()}</Avatar><Typography variant="body2" sx={{ fontWeight: 600 }}>{u.username}</Typography></Stack></TableCell>
                      <TableCell className="hide-mobile" color="text.secondary">{u.email}</TableCell>
                      <TableCell><Chip label={u.role} size="small" color={u.role === 'admin' ? 'success' : 'default'} variant={u.role === 'admin' ? 'filled' : 'outlined'} /></TableCell>
                      <TableCell className="hide-mobile" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell sx={{ textAlign: 'right' }}>
                        {u.role !== 'admin' && (
                          <Button size="small" startIcon={<PersonAddIcon sx={{ fontSize: 14 }} />} onClick={() => handlePromoteUser(u._id, u.username)} disabled={actionInProgress !== null} sx={{ color: 'success.main', borderColor: 'success.main', textTransform: 'none' }} variant="outlined">
                            Make Admin
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Tab 3: Add Story */}
      {activeTab === 3 && (
        <Stack direction={{ xs: 'column', md: isAdmin ? 'row' : 'column' }} spacing={3}>
          <Paper sx={{ p: 3, flex: 1, border: '1px solid rgba(255,255,255,0.06)' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 3 }}>
              <AddIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{isAdmin ? 'Add New Audio Story' : 'Suggest an Audio Story'}</Typography>
            </Stack>
            {!isAdmin && (
              <Paper sx={{ p: 2, mb: 3, background: 'rgba(255,94,43,0.05)', border: '1px solid rgba(255,94,43,0.2)' }}>
                <Typography variant="body2"><strong>Note:</strong> Your suggestion will be saved as pending and reviewed by an admin.</Typography>
              </Paper>
            )}
            <Box sx={{ mb: 3, p: 2, background: 'rgba(255,255,255,0.02)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
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
            </Box>
            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField fullWidth label="Story Title *" placeholder="e.g. Sunday Suspense | The Hound of the Baskervilles" value={title} onChange={(e) => setTitle(e.target.value)} required />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField select slotProps={{ select: { native: true } }} label="Channel *" value={channel} onChange={(e) => setChannel(e.target.value)} required sx={{ flex: 1 }}>
                    {channelsList.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
                  </TextField>
                  <TextField select slotProps={{ select: { native: true } }} label="Genre *" value={genre} onChange={(e) => setGenre(e.target.value)} required sx={{ flex: 1 }}>
                    {genresList.map((g) => <option key={g} value={g}>{g}</option>)}
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
                      } catch { /* writer already exists or error */ }
                    }
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Writer / Author" placeholder="Type to search or add new writer..." fullWidth />
                  )}
                  fullWidth
                />
                <TextField
                  select
                  slotProps={{ select: { native: true } }}
                  label="Year Published on YouTube"
                  value={yearPublished}
                  onChange={(e) => setYearPublished(e.target.value)}
                  fullWidth
                >
                  <option value=""></option>
                  {Array.from({ length: YEARS_RANGE }, (_, i) => new Date().getFullYear() - i).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </TextField>
                <TextField fullWidth multiline rows={4} label="Description" placeholder="Optional story synopsis..." value={description} onChange={(e) => setDescription(e.target.value)} />
                <TextField fullWidth label="Thumbnail URL" placeholder="Autofilled if YouTube link fetched" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} />
                <Button type="submit" variant="contained" fullWidth size="large" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : isAdmin ? 'Add Story to Database' : 'Submit Story Suggestion'}
                </Button>
              </Stack>
            </form>
          </Paper>
          {isAdmin && (
            <Paper sx={{ p: 3, width: 300, border: '1px solid rgba(255,255,255,0.06)', alignSelf: 'flex-start' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Duplicate Checks</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, fontSize: '0.85rem' }}>
                Bengaliboxd extracts the 11-character YouTube video ID and cross-checks the database to prevent duplicate entries, even if titles vary.
              </Typography>
            </Paper>
          )}
        </Stack>
      )}

      {/* Tab 4: Edit Story */}
      {isAdmin && activeTab === 4 && (
        <Stack spacing={3}>
          <Paper sx={{ p: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Search Stories to Edit</Typography>
            <Stack direction="row" spacing={2}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by title, channel, narrator..."
                value={editSearch}
                onChange={(e) => setEditSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearchStories(); }}
              />
              <Button variant="contained" onClick={handleSearchStories} disabled={loadingEdit}>
                {loadingEdit ? 'Searching...' : 'Search'}
              </Button>
            </Stack>
          </Paper>

          {!editingStory && editResults.length > 0 && (
            <Paper sx={{ p: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>{editResults.length} results found</Typography>
              <Stack spacing={1}>
                {editResults.map((story) => (
                  <Paper key={story._id} sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)', '&:hover': { borderColor: 'rgba(255,94,43,0.4)' } }} onClick={() => handleSelectStoryForEdit(story)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={YOUTUBE_THUMBNAIL(story.youtubeId)} alt="" style={{ width: 120, aspectRatio: '16/9', objectFit: 'cover', borderRadius: 8 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{story.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{story.channel} &bull; {story.narrator}</Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        <Chip label={story.genre} size="small" variant="outlined" />
                        <Chip label={story.approved ? 'Approved' : 'Pending'} size="small" color={story.approved ? 'success' : 'warning'} variant="outlined" />
                      </Stack>
                    </Box>
                    <Button size="small" variant="outlined">Edit</Button>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          )}

          {editingStory && (
            <Paper sx={{ p: 3, border: '1px solid rgba(255,94,43,0.2)' }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Editing: {editingStory.title}</Typography>
                <Button size="small" onClick={() => setEditingStory(null)}>Cancel</Button>
              </Stack>
              <Stack spacing={2.5}>
                <TextField fullWidth label="Title" value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField select slotProps={{ select: { native: true } }} label="Channel" value={editForm.channel} onChange={(e) => setEditForm((p) => ({ ...p, channel: e.target.value }))} sx={{ flex: 1 }}>
                    {channelsList.map((ch) => <option key={ch} value={ch}>{ch}</option>)}
                  </TextField>
                  <TextField select slotProps={{ select: { native: true } }} label="Genre" value={editForm.genre} onChange={(e) => setEditForm((p) => ({ ...p, genre: e.target.value }))} sx={{ flex: 1 }}>
                    {genresList.map((g) => <option key={g} value={g}>{g}</option>)}
                  </TextField>
                </Stack>
                <TextField fullWidth label="Narrator(s)" value={editForm.narrator} onChange={(e) => setEditForm((p) => ({ ...p, narrator: e.target.value }))} />
                <Autocomplete
                  freeSolo
                  options={writers.map((w) => w.name)}
                  value={editForm.writer}
                  onInputChange={(_, newValue) => setEditForm((p) => ({ ...p, writer: newValue || '' }))}
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
                <TextField
                  select
                  slotProps={{ select: { native: true } }}
                  label="Year Published"
                  value={editForm.yearPublished}
                  onChange={(e) => setEditForm((p) => ({ ...p, yearPublished: e.target.value }))}
                  fullWidth
                >
                  <option value="">Select Year (optional)</option>
                  {Array.from({ length: YEARS_RANGE }, (_, i) => new Date().getFullYear() - i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </TextField>
                <Button variant="contained" fullWidth size="large" onClick={handleUpdateStory} disabled={savingEdit}>
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </Button>
              </Stack>
            </Paper>
          )}
        </Stack>
      )}

      {/* Tab 5: Settings */}
      {isAdmin && activeTab === 5 && (
        loadingSettings ? <AppLoadingState message="Loading settings..." /> : (
          <Paper sx={{ p: 3, maxWidth: 600, border: '1px solid rgba(255,255,255,0.06)' }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 3 }}>
              <SettingsIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Contributor Permissions</Typography>
            </Stack>
            <Divider sx={{ mb: 3 }} />
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Allow User Story Submissions</Typography>
                <Typography variant="body2" color="text.secondary">
                  {allowUserSubmissions ? 'Users can suggest stories that appear in Pending Approvals.' : 'Only admins can add stories directly.'}
                </Typography>
              </Box>
              <Switch checked={allowUserSubmissions} onChange={handleToggleSubmissions} disabled={savingSettings} color="primary" />
            </Stack>
          </Paper>
        )
      )}

      <AppConfirmModal open={confirmModal.open} title={confirmModal.title} message={confirmModal.message} severity={confirmModal.severity} onConfirm={confirmModal.action} onCancel={() => setConfirmModal((p) => ({ ...p, open: false }))} confirmLabel={confirmModal.severity === 'error' ? 'Delete' : 'Confirm'} />
    </Box>
  );
}
