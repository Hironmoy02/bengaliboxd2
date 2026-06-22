'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector } from '@/lib/hooks';
import api from '@/lib/axios';
import { YOUTUBE_THUMBNAIL } from '@/lib/constants';
import {
  Box, Typography, Button, Paper, Stack, TextField, Tab, Tabs, Avatar, Chip, Divider,
  IconButton, Tooltip, useMediaQuery, useTheme, MenuItem,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import FeedbackIcon from '@mui/icons-material/Feedback';
import BookmarkIcon from '@mui/icons-material/Bookmark';
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

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    setLoadingData(true);
    api.get('/api/profile').then(({ data }) => {
      setProfile(data.user);
      setUsername(data.user.username);
      setStories(data.stories || []);
      setRatings(data.ratings || []);
    }).catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoadingData(false));
    api.get('/api/writers').then(({ data }) => setWritersList(data.writers || [])).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (activeTab === 3) fetchBookmarks(bookmarkPage, bookmarkSort);
  }, [activeTab, bookmarkPage, bookmarkSort]);

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
    setLoadingBookmarks(true);
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
          borderBottom: '1px solid rgba(255,255,255,0.08)',
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
        <Tab icon={<LibraryAddIcon />} iconPosition="start" label={isMobile ? `Stories (${stories.length})` : `My Stories (${stories.length})`} />
        <Tab icon={<HeadphonesIcon />} iconPosition="start" label={isMobile ? `Heard (${ratings.length})` : `Listened (${ratings.length})`} />
        <Tab icon={<BookmarkIcon />} iconPosition="start" label={isMobile ? undefined : "Bookmarks"} />
        <Tab icon={<FeedbackIcon />} iconPosition="start" label={isMobile ? undefined : "Feedback"} />
      </Tabs>

      {/* Tab 0: Account */}
      {activeTab === 0 && (
        <Paper sx={{ p: { xs: 2, sm: 3 }, maxWidth: 500, border: '1px solid rgba(255,255,255,0.06)' }}>
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
              <Paper key={s._id} sx={{ p: 1.5, display: 'flex', gap: 1.5, alignItems: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
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
                    <Box key={h} component="th" sx={{ textAlign: 'left', fontWeight: 600, pb: 1, px: 1, borderBottom: '1px solid rgba(255,255,255,0.08)', whiteSpace: 'nowrap', fontSize: '0.85rem', color: 'text.secondary' }}>{h}</Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {stories.map((s) => (
                  <Box key={s._id} component="tr" sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
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
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Stories I&apos;ve Listened To</Typography>

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
                <Paper key={r._id} sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', gap: { xs: 1.5, sm: 2 }, alignItems: 'flex-start', border: '1px solid rgba(255,255,255,0.06)' }}>
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

      {/* Tab 3: Bookmarks */}
      {activeTab === 3 && (
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
                  <Paper key={b._id} sx={{ p: { xs: 1.5, sm: 2 }, display: 'flex', gap: { xs: 1.5, sm: 2 }, alignItems: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
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

      {/* Tab 4: Feedback */}
      {activeTab === 4 && (
        <Paper sx={{ p: { xs: 2, sm: 3 }, maxWidth: 600, border: '1px solid rgba(255,255,255,0.06)' }}>
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
