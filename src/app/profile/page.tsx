'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector } from '@/lib/hooks';
import api from '@/lib/axios';
import { YOUTUBE_THUMBNAIL } from '@/lib/constants';
import {
  Box, Typography, Button, Paper, Stack, TextField, Tab, Tabs, Avatar, Chip, Divider,
  IconButton, Tooltip, useMediaQuery, useTheme, MenuItem, Card, CardContent,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import FeedbackIcon from '@mui/icons-material/Feedback';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import FavoriteIcon from '@mui/icons-material/Favorite';
import StarIcon from '@mui/icons-material/Star';
import BarChartIcon from '@mui/icons-material/BarChart';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TimerIcon from '@mui/icons-material/Timer';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MicIcon from '@mui/icons-material/Mic';
import { AppAlert, AppLoadingState, AppEmptyState, AppStarRating, AppPagination } from '@/components/ui';

function getErrorMessage(err: unknown): string { return err instanceof Error ? err.message : 'An error occurred'; }

interface UserProfile { _id: string; username: string; email: string; role: string; createdAt: string; }
interface Story { _id: string; title: string; channel: string; youtubeId: string; approved: boolean; createdAt: string; averageRating: number; ratingsCount: number; }
interface Rating { _id: string; storyId: { _id: string; title: string; youtubeId: string; narrator?: string; writer?: string; channel?: string; yearPublished?: number } | null; ratingValue: number; reviewText: string; updatedAt: string; }

export default function ProfilePage() {
  const { user, loading } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [activeTab, setActiveTab] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const [feedbackCategory, setFeedbackCategory] = useState('improvement');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [filterRating, setFilterRating] = useState('All');
  const [filterAuthor, setFilterAuthor] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [writersList, setWritersList] = useState<{ _id: string; name: string }[]>([]);

  interface BookmarkStory { _id: string; title: string; channel: string; narrator: string; youtubeId: string; averageRating: number; ratingsCount: number; bookmarkedAt: string; }
  const [bookmarks, setBookmarks] = useState<BookmarkStory[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [bookmarkSort, setBookmarkSort] = useState('newest');
  const [bookmarkPage, setBookmarkPage] = useState(1);
  const [bookmarkTotalPages, setBookmarkTotalPages] = useState(1);

  interface ListenStory { _id: string; title: string; channel: string; narrator: string; writer?: string; youtubeId: string; averageRating: number; ratingsCount: number; listenedAt: string; userRating: number; }
  const [listens, setListens] = useState<ListenStory[]>([]);
  const [loadingListens, setLoadingListens] = useState(false);
  const [listenPage, setListenPage] = useState(1);
  const [listenTotalPages, setListenTotalPages] = useState(1);
  const [listenSort, setListenSort] = useState('newest');
  const [listenFilterRating, setListenFilterRating] = useState('All');

  interface UserStats { totalListened: number; totalHours: number; totalRatings: number; topGenre: string | null; topAuthor: string | null; topNarrator: string | null; }
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  interface LikedStory { _id: string; title: string; channel: string; narrator: string; youtubeId: string; averageRating: number; ratingsCount: number; likedAt: string; }
  const [likedStories, setLikedStories] = useState<LikedStory[]>([]);
  const [loadingLiked, setLoadingLiked] = useState(false);
  const [likedPage, setLikedPage] = useState(1);
  const [likedTotalPages, setLikedTotalPages] = useState(1);
  const [likedSort, setLikedSort] = useState('newest');

  useEffect(() => {
    if (activeTab === 6 && !userStats && !loadingStats) {
      Promise.resolve().then(() => setLoadingStats(true));
      api.get('/api/user/stats').then(({ data }) => setUserStats(data.stats)).catch(() => {}).finally(() => setLoadingStats(false));
    }
  }, [activeTab, userStats, loadingStats, user]);

  const handleUpdateProfile = async () => {
    setError(''); setSuccess(''); setSaving(true);
    try {
      const payload: Record<string, string> = {};
      if (username && username !== profile?.username) payload.username = username;
      if (currentPassword) {
        if (!newPassword) { setError('Enter new password'); setSaving(false); return; }
        if (newPassword !== confirmPassword) { setError('Passwords do not match'); setSaving(false); return; }
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      if (Object.keys(payload).length === 0) { setSuccess('No changes to save'); setSaving(false); return; }
      const { data } = await api.put('/api/profile', payload);
      setProfile(data.user);
      setUsername(data.user.username);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setSuccess(data.message);
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) { setError('Please enter your feedback'); return; }
    setError(''); setSuccess(''); setSubmittingFeedback(true);
    try {
      await api.post('/api/feedback', { category: feedbackCategory, message: feedbackMessage });
      setSuccess('Thank you for your feedback!');
      setFeedbackMessage('');
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSubmittingFeedback(false); }
  };

  const fetchBookmarks = async (page: number, sort: string) => {
    Promise.resolve().then(() => setLoadingBookmarks(true));
    try {
      const { data } = await api.get('/api/bookmarks', { params: { page, limit: 10, sortBy: sort } });
      setBookmarks(data.bookmarks || []);
      setBookmarkTotalPages(data.pagination?.totalPages || 1);
    } catch { console.error('Failed to load bookmarks'); }
    finally { setLoadingBookmarks(false); }
  };

  const handleRemoveBookmark = async (storyId: string) => {
    try {
      await api.delete('/api/bookmarks', { data: { storyId } });
      setBookmarks((prev) => prev.filter((b) => b._id !== storyId));
    } catch { /* ignore */ }
  };

  const fetchListens = async (page: number, sort: string, rating: string) => {
    Promise.resolve().then(() => setLoadingListens(true));
    try {
      const { data } = await api.get('/api/listens', { params: { page, limit: 10, sortBy: sort, rating } });
      setListens(data.listens || []);
      setListenTotalPages(data.pagination?.totalPages || 1);
    } catch { console.error('Failed to load listening history'); }
    finally { setLoadingListens(false); }
  };

  const handleRemoveListen = async (storyId: string) => {
    try {
      await api.delete('/api/listens', { data: { storyId } });
      setListens((prev) => prev.filter((l) => l._id !== storyId));
    } catch { /* ignore */ }
  };

  const fetchLikedStories = async (page: number, sort: string) => {
    Promise.resolve().then(() => setLoadingLiked(true));
    try {
      const { data } = await api.get('/api/likes', { params: { page, limit: 10, sortBy: sort } });
      setLikedStories(data.likes || []);
      setLikedTotalPages(data.pagination?.totalPages || 1);
    } catch { console.error('Failed to load liked stories'); }
    finally { setLoadingLiked(false); }
  };

  const handleRemoveLike = async (storyId: string) => {
    try {
      await api.delete('/api/likes', { data: { storyId } });
      setLikedStories((prev) => prev.filter((b) => b._id !== storyId));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.get('/api/profile').then(({ data }) => {
      setProfile(data.user);
      setUsername(data.user.username);
      setStories(data.stories || []);
      setRatings(data.ratings || []);
      setListens(data.listens || []);
      setLikedStories(data.likes || []);
    }).catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoadingData(false));
    api.get('/api/writers').then(({ data }) => setWritersList(data.writers || [])).catch(() => {});
  }, [user]);

  useEffect(() => {
    Promise.resolve().then(() => {
      if (activeTab === 2) fetchListens(listenPage, listenSort, listenFilterRating);
      if (activeTab === 4) fetchLikedStories(likedPage, likedSort);
      if (activeTab === 5) fetchBookmarks(bookmarkPage, bookmarkSort);
    });
  }, [activeTab, listenPage, listenSort, listenFilterRating, likedPage, likedSort, bookmarkPage, bookmarkSort]);

  const uniqueRatings = useMemo(() => {
    const set = new Set<number>();
    ratings.forEach((r) => { if (r.storyId) set.add(r.ratingValue); });
    return Array.from(set).sort((a, b) => b - a);
  }, [ratings]);

  const uniqueAuthors = useMemo(() => {
    const listenedWriters = new Set<string>();
    ratings.forEach((r) => { if (r.storyId?.writer) listenedWriters.add(r.storyId.writer); });
    return writersList
      .filter((w) => listenedWriters.has(w.name))
      .map((w) => w.name)
      .sort();
  }, [ratings, writersList]);

  const uniqueYears = useMemo(() => {
    const set = new Set<number>();
    ratings.forEach((r) => { if (r.storyId?.yearPublished) set.add(r.storyId.yearPublished); });
    return Array.from(set).sort((a, b) => b - a);
  }, [ratings]);

  const filteredRatings = useMemo(() => {
    return ratings.filter((r) => {
      if (!r.storyId) return false;
      if (filterRating !== 'All' && r.ratingValue !== Number(filterRating)) return false;
      if (filterAuthor !== 'All' && r.storyId.writer !== filterAuthor) return false;
      if (filterYear !== 'All' && r.storyId.yearPublished !== Number(filterYear)) return false;
      return true;
    });
  }, [ratings, filterRating, filterAuthor, filterYear]);

  const listensByMonth = useMemo(() => {
    const groups: Record<string, ListenStory[]> = {};
    listens.forEach((l) => {
      const d = new Date(l.listenedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(l);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])).map(([key, items]) => {
      const [y, m] = key.split('-');
      const label = new Date(Number(y), Number(m) - 1).toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
      return { key, label, items };
    });
  }, [listens]);

  if (loading || !user || loadingData) return <AppLoadingState message="Loading profile..." fullScreen />;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 1.5, sm: 2 }, py: { xs: 3, sm: 5 }, minHeight: '80vh' }}>
      {error && <AppAlert severity="error" message={error} onClose={() => setError('')} />}
      {success && <AppAlert severity="success" message={success} onClose={() => setSuccess('')} />}

      {/* Profile Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: { xs: 3, sm: 4 }, alignItems: { sm: 'center' } }}>
        <Avatar sx={{ width: { xs: 56, sm: 64 }, height: { xs: 56, sm: 64 }, bgcolor: 'primary.main', fontSize: { xs: 20, sm: 24 } }}>
          {profile?.username?.[0]?.toUpperCase() || 'U'}
        </Avatar>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>{profile?.username}</Typography>
          <Typography variant="body2" color="text.secondary">{profile?.email} &bull; Joined {new Date(profile?.createdAt || '').toLocaleDateString()}</Typography>
        </Box>
      </Stack>

      {/* Tabs — scrollable on mobile, compact labels */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          mb: { xs: 3, sm: 4 },
          borderBottom: '1px solid', borderColor: 'divider',
          minHeight: 44,
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: { xs: '0.75rem', sm: '0.9rem' },
            minHeight: 44,
            minWidth: 0,
            px: { xs: 1, sm: 2 },
          },
          '& .MuiTab-iconWrapper': { mr: { xs: 0.3, sm: 0.5 } },
        }}
      >
        <Tab icon={<PersonIcon />} iconPosition="start" label={isMobile ? undefined : "Account"} />
        <Tab icon={<LibraryAddIcon />} iconPosition="start" label={isMobile ? undefined : `My Stories (${stories.length})`} />
        <Tab icon={<HeadsetMicIcon />} iconPosition="start" label={isMobile ? undefined : `Listened (${listens.length})`} />
        <Tab icon={<StarIcon />} iconPosition="start" label={isMobile ? undefined : `Rated (${ratings.length})`} />
        <Tab icon={<FavoriteIcon />} iconPosition="start" label={isMobile ? undefined : `Liked (${likedStories.length})`} />
        <Tab icon={<BookmarkIcon />} iconPosition="start" label={isMobile ? undefined : "Bookmarks"} />
        <Tab icon={<BarChartIcon />} iconPosition="start" label={isMobile ? undefined : "Stats"} />
        <Tab icon={<FeedbackIcon />} iconPosition="start" label={isMobile ? undefined : "Feedback"} />
      </Tabs>

      {/* Tab 0: Account */}
      {activeTab === 0 && (
        <Paper sx={{ p: { xs: 2, sm: 3 }, maxWidth: 500, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Account Settings</Typography>
          <Stack spacing={2}>
            <TextField fullWidth label="Username" value={username} onChange={(e) => setUsername(e.target.value)} size={isMobile ? 'small' : 'medium'} />
            <TextField fullWidth label="Email" value={profile?.email || ''} disabled size={isMobile ? 'small' : 'medium'} />
            <Divider />
            <Typography variant="subtitle2" color="text.secondary">Change Password</Typography>
            <TextField fullWidth type="password" label="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Leave blank to keep current" size={isMobile ? 'small' : 'medium'} />
            <TextField fullWidth type="password" label="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 6 characters" size={isMobile ? 'small' : 'medium'} />
            <TextField fullWidth type="password" label="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} size={isMobile ? 'small' : 'medium'} />
            <Button variant="contained" fullWidth onClick={handleUpdateProfile} disabled={saving} size={isMobile ? 'small' : 'medium'}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Tab 1: My Stories — table on desktop, cards on mobile */}
      {activeTab === 1 && (
        stories.length === 0 ? (
          <AppEmptyState title="No stories yet" message="You haven't added any stories yet." actionLabel="Add a Story" actionHref="/add-story" />
        ) : isMobile ? (
          <Stack spacing={1.5}>
            {stories.map((s) => (
              <Paper key={s._id} sx={{ p: 1.5, display: 'flex', gap: 1.5, alignItems: 'center', border: '1px solid', borderColor: 'divider' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={YOUTUBE_THUMBNAIL(s.youtubeId)} alt="" style={{ width: 80, aspectRatio: '16/9', objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Link href={`/story/${s._id}`} style={{ color: '#e2e8f0', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {s.title}
                  </Link>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>{s.channel}</Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: 'center' }}>
                    <Chip label={s.approved ? 'Approved' : 'Pending'} size="small" color={s.approved ? 'success' : 'warning'} variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                    <Typography variant="caption" color="text.secondary">{s.averageRating > 0 ? `${s.averageRating.toFixed(1)} (${s.ratingsCount})` : '—'}</Typography>
                  </Stack>
                </Box>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
              <Box component="thead">
                <Box component="tr">
                  {['Story', 'Channel', 'Status', 'Rating', 'Added'].map((h) => (
                    <Box key={h} component="th" sx={{ textAlign: 'left', fontWeight: 600, pb: 1, px: 1, borderBottom: '1px solid', borderColor: 'divider', whiteSpace: 'nowrap', fontSize: '0.85rem', color: 'text.secondary' }}>{h}</Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {stories.map((s) => (
                  <Box key={s._id} component="tr" sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                    <Box component="td" sx={{ py: 1.5, px: 1 }}>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={YOUTUBE_THUMBNAIL(s.youtubeId)} alt="" style={{ width: 80, aspectRatio: '16/9', objectFit: 'cover', borderRadius: 6 }} />
                        <Link href={`/story/${s._id}`} style={{ color: '#e2e8f0', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem' }}>
                          {s.title}
                        </Link>
                      </Stack>
                    </Box>
                    <Box component="td" sx={{ py: 1.5, px: 1, color: 'text.secondary' }}>{s.channel}</Box>
                    <Box component="td" sx={{ py: 1.5, px: 1 }}>
                      <Chip label={s.approved ? 'Approved' : 'Pending'} size="small" color={s.approved ? 'success' : 'warning'} variant="outlined" />
                    </Box>
                    <Box component="td" sx={{ py: 1.5, px: 1 }}>{s.averageRating > 0 ? `${s.averageRating.toFixed(1)} (${s.ratingsCount})` : '—'}</Box>
                    <Box component="td" sx={{ py: 1.5, px: 1, color: 'text.secondary', fontSize: '0.85rem' }}>{new Date(s.createdAt).toLocaleDateString()}</Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        )
      )}

      {/* Tab 2: Listened */}
      {activeTab === 2 && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Listened</Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3, alignItems: { sm: 'center' } }}>
            <TextField
              select
              size="small"
              value={listenFilterRating}
              onChange={(e) => { setListenFilterRating(e.target.value); setListenPage(1); }}
              fullWidth={isMobile}
              slotProps={{ select: { native: true } }}
            >
              <option value="All">All Ratings</option>
              <option value="unrated">Unrated</option>
              <option value="5">5 Stars</option>
              <option value="4.5">4.5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3.5">3.5 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2.5">2.5 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1.5">1.5 Stars</option>
              <option value="1">1 Star</option>
              <option value="0.5">0.5 Stars</option>
            </TextField>

            <TextField
              select
              size="small"
              value={listenSort}
              onChange={(e) => { setListenSort(e.target.value); setListenPage(1); }}
              fullWidth={isMobile}
              slotProps={{ select: { native: true } }}
            >
              <option value="newest">Listened Date (Newest)</option>
              <option value="oldest">Listened Date (Oldest)</option>
              <option value="rating-desc">Your Rating (Highest)</option>
              <option value="rating-asc">Your Rating (Lowest)</option>
            </TextField>
          </Stack>

          {loadingListens ? <AppLoadingState message="Loading listening history..." /> : listens.length === 0 ? (
            <AppEmptyState
              title="No listening history yet"
              message="Mark stories as listened to track your journey."
              actionLabel="Browse Stories"
              actionHref="/"
            />
          ) : (
            <>
              <Stack spacing={1.5}>
                {listens.map((l) => (
                  <Paper key={l._id} sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', gap: { xs: 1.5, sm: 2 }, alignItems: 'center', border: '1px solid', borderColor: 'divider' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://img.youtube.com/vi/${l.youtubeId}/hqdefault.jpg`} alt="" style={{ width: isMobile ? 80 : 100, aspectRatio: '16/9', objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Link href={`/story/${l._id}`} style={{ color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'none', fontSize: isMobile ? '0.85rem' : '0.95rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {l.title}
                      </Link>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {l.channel}{l.narrator ? ` \u2022 ${l.narrator}` : ''}
                        {l.writer ? ` \u2022 Written by ${l.writer}` : ''}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                        {l.userRating > 0 ? (
                          <>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#f59e0b' }}>Your Rating:</Typography>
                            <AppStarRating value={l.userRating} readonly size={isMobile ? 10 : 12} />
                          </>
                        ) : (
                          <Typography variant="caption" color="text.secondary">Not rated yet</Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>&bull; Avg Rating:</Typography>
                        <AppStarRating value={l.averageRating} readonly size={isMobile ? 10 : 12} />
                        <Typography variant="caption" color="text.secondary">({l.ratingsCount})</Typography>
                        <Typography variant="caption" color="text.secondary">&bull; Listened {new Date(l.listenedAt).toLocaleDateString()}</Typography>
                      </Stack>
                    </Box>
                    <Tooltip title="Remove from listened">
                      <IconButton onClick={() => handleRemoveListen(l._id)} sx={{ color: 'text.secondary', p: { xs: 0.5, sm: 1 } }}>
                        <HeadphonesIcon fontSize={isMobile ? 'small' : 'medium'} />
                      </IconButton>
                    </Tooltip>
                  </Paper>
                ))}
              </Stack>
              {listenTotalPages > 1 && (
                <AppPagination page={listenPage} totalPages={listenTotalPages} onChange={setListenPage} showTotal={false} />
              )}
            </>
          )}
        </Box>
      )}

      {/* Tab 3: Rated */}
      {activeTab === 3 && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Stories I&apos;ve Rated</Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3, alignItems: { sm: 'center' } }}>
            <TextField
              select
              size="small"
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              fullWidth={isMobile}
              slotProps={{ select: { native: true } }}
            >
              <option value="All">All Ratings</option>
              {uniqueRatings.map((r) => (
                <option key={r} value={r}>{r} Star{r !== 1 ? 's' : ''}</option>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              value={filterAuthor}
              onChange={(e) => setFilterAuthor(e.target.value)}
              fullWidth={isMobile}
              slotProps={{ select: { native: true } }}
            >
              <option value="All">All Authors</option>
              {uniqueAuthors.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              fullWidth={isMobile}
              slotProps={{ select: { native: true } }}
            >
              <option value="All">All Years</option>
              {uniqueYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </TextField>

            {(filterRating !== 'All' || filterAuthor !== 'All' || filterYear !== 'All') && (
              <Button size="small" onClick={() => { setFilterRating('All'); setFilterAuthor('All'); setFilterYear('All'); }}>
                Clear Filters
              </Button>
            )}
          </Stack>

          {filteredRatings.length === 0 ? (
            <AppEmptyState
              title="No matches"
              message={ratings.length === 0 ? "You haven't rated any stories yet." : "No stories match the selected filters."}
              actionLabel={ratings.length === 0 ? "Browse Stories" : undefined}
              actionHref={ratings.length === 0 ? "/" : undefined}
            />
          ) : (
            <Stack spacing={1.5}>
              {filteredRatings.map((r) => (
                <Paper key={r._id} sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', gap: { xs: 1.5, sm: 2 }, alignItems: 'flex-start', border: '1px solid', borderColor: 'divider' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://img.youtube.com/vi/${r.storyId!.youtubeId}/hqdefault.jpg`} alt="" style={{ width: isMobile ? 80 : 100, aspectRatio: '16/9', objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/story/${r.storyId!._id}`} style={{ color: '#e2e8f0', fontWeight: 600, textDecoration: 'none', fontSize: isMobile ? '0.85rem' : '0.95rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {r.storyId!.title}
                    </Link>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {r.storyId!.channel}{r.storyId!.narrator ? ` \u2022 ${r.storyId!.narrator}` : ''}
                      {r.storyId!.writer ? ` \u2022 Written by ${r.storyId!.writer}` : ''}
                      {r.storyId!.yearPublished ? ` \u2022 ${r.storyId!.yearPublished}` : ''}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                      <AppStarRating value={r.ratingValue} readonly size={isMobile ? 12 : 14} />
                      <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 600 }}>{r.ratingValue}</Typography>
                      <Typography variant="caption" color="text.secondary">{new Date(r.updatedAt).toLocaleDateString()}</Typography>
                    </Stack>
                    {r.reviewText && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>&ldquo;{r.reviewText}&rdquo;</Typography>}
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
      )}

      {/* Tab 4: Liked */}
      {activeTab === 4 && (
        <Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 1, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Liked Stories</Typography>
            <TextField
              select
              size="small"
              value={likedSort}
              onChange={(e) => { setLikedSort(e.target.value); setLikedPage(1); }}
              fullWidth={isMobile}
              slotProps={{ select: { native: true } }}
            >
              <option value="newest">Newest First</option>
              <option value="title">Title (A-Z)</option>
              <option value="rating">Highest Rated</option>
            </TextField>
          </Stack>
          {loadingLiked ? <AppLoadingState message="Loading liked stories..." /> : likedStories.length === 0 ? (
            <AppEmptyState title="No liked stories yet" message="Stories you like will appear here." actionLabel="Browse Stories" actionHref="/" />
          ) : (
            <>
              <Stack spacing={1.5}>
                {likedStories.map((b) => (
                  <Paper key={b._id} sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', gap: { xs: 1.5, sm: 2 }, alignItems: 'center', border: '1px solid', borderColor: 'divider' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://img.youtube.com/vi/${b.youtubeId}/hqdefault.jpg`} alt="" style={{ width: isMobile ? 80 : 120, aspectRatio: '16/9', objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Link href={`/story/${b._id}`} style={{ color: '#e2e8f0', fontWeight: 600, textDecoration: 'none', fontSize: isMobile ? '0.85rem' : '0.95rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {b.title}
                      </Link>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {b.channel} &bull; {b.narrator}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: 'center' }}>
                        <AppStarRating value={b.averageRating} readonly size={isMobile ? 10 : 12} />
                        <Typography variant="caption" color="text.secondary">({b.ratingsCount})</Typography>
                        <Typography variant="caption" color="text.secondary">&bull; Liked {new Date(b.likedAt).toLocaleDateString()}</Typography>
                      </Stack>
                    </Box>
                    <Tooltip title="Unlike story">
                      <IconButton onClick={() => handleRemoveLike(b._id)} sx={{ color: '#ef4444', p: { xs: 0.5, sm: 1 } }}>
                        <FavoriteIcon fontSize={isMobile ? 'small' : 'medium'} />
                      </IconButton>
                    </Tooltip>
                  </Paper>
                ))}
              </Stack>
              {likedTotalPages > 1 && (
                <AppPagination page={likedPage} totalPages={likedTotalPages} onChange={(p) => setLikedPage(p)} showTotal={false} />
              )}
            </>
          )}
        </Box>
      )}

      {/* Tab 5: Bookmarks */}
      {activeTab === 5 && (
        <Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 1, mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Bookmarked Stories</Typography>
            <TextField
              select
              size="small"
              value={bookmarkSort}
              onChange={(e) => { setBookmarkSort(e.target.value); setBookmarkPage(1); }}
              fullWidth={isMobile}
              slotProps={{ select: { native: true } }}
            >
              <option value="newest">Newest First</option>
              <option value="title">Title (A-Z)</option>
              <option value="rating">Highest Rated</option>
            </TextField>
          </Stack>
          {loadingBookmarks ? <AppLoadingState message="Loading bookmarks..." /> : bookmarks.length === 0 ? (
            <AppEmptyState title="No bookmarks yet" message="Save stories to listen to later." actionLabel="Browse Stories" actionHref="/" />
          ) : (
            <>
              <Stack spacing={1.5}>
                {bookmarks.map((b) => (
                  <Paper key={b._id} sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', gap: { xs: 1.5, sm: 2 }, alignItems: 'center', border: '1px solid', borderColor: 'divider' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`https://img.youtube.com/vi/${b.youtubeId}/hqdefault.jpg`} alt="" style={{ width: isMobile ? 80 : 120, aspectRatio: '16/9', objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Link href={`/story/${b._id}`} style={{ color: '#e2e8f0', fontWeight: 600, textDecoration: 'none', fontSize: isMobile ? '0.85rem' : '0.95rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {b.title}
                      </Link>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {b.channel} &bull; {b.narrator}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: 'center' }}>
                        <AppStarRating value={b.averageRating} readonly size={isMobile ? 10 : 12} />
                        <Typography variant="caption" color="text.secondary">({b.ratingsCount})</Typography>
                        <Typography variant="caption" color="text.secondary">&bull; Saved {new Date(b.bookmarkedAt).toLocaleDateString()}</Typography>
                      </Stack>
                    </Box>
                    <Tooltip title="Remove bookmark">
                      <IconButton onClick={() => handleRemoveBookmark(b._id)} sx={{ color: 'primary.main', p: { xs: 0.5, sm: 1 } }}>
                        <BookmarkIcon fontSize={isMobile ? 'small' : 'medium'} />
                      </IconButton>
                    </Tooltip>
                  </Paper>
                ))}
              </Stack>
              {bookmarkTotalPages > 1 && (
                <AppPagination page={bookmarkPage} totalPages={bookmarkTotalPages} onChange={(p) => setBookmarkPage(p)} showTotal={false} />
              )}
            </>
          )}
        </Box>
      )}

      {/* Tab 6: Stats */}
      {activeTab === 6 && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Your Listening Stats</Typography>
          {loadingStats ? <AppLoadingState message="Loading stats..." /> : !userStats ? (
            <AppEmptyState title="No stats yet" message="Start listening to stories to see your stats!" actionLabel="Browse Stories" actionHref="/" />
          ) : (
            <Stack spacing={3}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {[
                  { label: 'Stories Listened', value: userStats.totalListened, icon: <HeadphonesIcon />, color: 'primary.main' },
                  { label: 'Hours Listened', value: userStats.totalHours, icon: <TimerIcon />, color: '#f59e0b' },
                  { label: 'Reviews Written', value: userStats.totalRatings, icon: <StarIcon />, color: '#a78bfa' },
                ].map((card) => (
                  <Card key={card.label} sx={{ flex: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider', background: 'action.hover' }}>
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Box sx={{ color: card.color, mb: 1 }}>{card.icon}</Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>{card.label}</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>{card.value}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>

              <Paper sx={{ p: 3, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Your Taste Profile</Typography>
                <Stack spacing={2}>
                  {userStats.topGenre && (
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                      <AutoAwesomeIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Favorite Genre</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{userStats.topGenre}</Typography>
                      </Box>
                    </Stack>
                  )}
                  {userStats.topAuthor && (
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                      <MenuBookIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Favorite Author</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{userStats.topAuthor}</Typography>
                      </Box>
                    </Stack>
                  )}
                  {userStats.topNarrator && (
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                      <MicIcon sx={{ color: 'success.main', fontSize: 20 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">Favorite Narrator</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{userStats.topNarrator}</Typography>
                      </Box>
                    </Stack>
                  )}
                  {!userStats.topGenre && !userStats.topAuthor && !userStats.topNarrator && (
                    <Typography variant="body2" color="text.secondary">Listen to more stories to see your taste profile!</Typography>
                  )}
                </Stack>
              </Paper>
            </Stack>
          )}
        </Box>
      )}

      {/* Tab 7: Feedback */}
      {activeTab === 7 && (
        <Paper sx={{ p: { xs: 2, sm: 3 }, maxWidth: 600, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Share Your Feedback</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Have a suggestion or found a bug? Let us know how to improve Bengaliboxd.
          </Typography>
          <Stack spacing={2}>
            <TextField select fullWidth size="small" value={feedbackCategory} label="Category" onChange={(e) => setFeedbackCategory(e.target.value)}>
              <MenuItem value="bug">Bug Report</MenuItem>
              <MenuItem value="feature">Feature Request</MenuItem>
              <MenuItem value="improvement">Improvement Suggestion</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
            <TextField fullWidth multiline rows={isMobile ? 3 : 4} label="Your Feedback" placeholder="Describe your suggestion or issue in detail..." value={feedbackMessage} onChange={(e) => setFeedbackMessage(e.target.value)} />
            <Button variant="contained" fullWidth onClick={handleSubmitFeedback} disabled={submittingFeedback} size={isMobile ? 'small' : 'medium'}>
              {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
