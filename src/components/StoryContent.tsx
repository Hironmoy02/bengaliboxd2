'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/lib/hooks';
import api from '@/lib/axios';
import {
  Box, Typography, Button, Paper, Stack, Chip, TextField, Divider, Avatar, LinearProgress, IconButton, Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import { AppPagination, AppAlert, AppStarRating, AppRatingDisplay, AppLoadingState, AppEmptyState } from '@/components/ui';

const YoutubeIcon = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="#ef4444" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.388.511a3.003 3.003 0 0 0-2.11 2.107C0 8.053 0 12 0 12s0 3.948.502 5.837a3.003 3.003 0 0 0 2.11 2.107c1.883.511 9.388.511 9.388.511s7.505 0 9.388-.511a3.003 3.003 0 0 0 2.11-2.107C24 15.948 24 12 24 12s0-3.948-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

interface Story {
  _id: string;
  title: string;
  channel: string;
  youtubeUrl: string;
  narrator: string;
  genre: string;
  writer?: string;
  youtubeId: string;
  thumbnailUrl: string;
  averageRating: number;
  ratingsCount: number;
  description?: string;
}

interface ReviewUser { _id: string; username: string; }
interface Review { _id: string; userId: ReviewUser; ratingValue: number; reviewText: string; updatedAt: string; }
interface Pagination { page: number; limit: number; total: number; totalPages: number; }

interface StoryContentProps {
  initialStory: Story;
  initialReviews: Review[];
  initialPagination: Pagination;
}

export default function StoryContent({ initialStory, initialReviews, initialPagination }: StoryContentProps) {
  const { user } = useAppSelector((s) => s.auth);
  const [story] = useState<Story>(initialStory);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [reviewPage, setReviewPage] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const existingReview = useMemo(() => {
    if (!user) return null;
    return reviews.find((rev) => rev.userId._id === user.id) || null;
  }, [user, reviews]);

  const [userRating, setUserRating] = useState<number>(() => existingReview?.ratingValue ?? 0);
  const [reviewText, setReviewText] = useState(() => existingReview?.reviewText ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (user) {
      api.get('/api/bookmarks/check', { params: { storyId: story._id } })
        .then(({ data }) => setIsBookmarked(data.bookmarked))
        .catch(() => {});
    }
  }, [user, story._id]);

  const handleToggleBookmark = async () => {
    if (!user) return;
    try {
      if (isBookmarked) {
        await api.delete('/api/bookmarks', { data: { storyId: story._id } });
        setIsBookmarked(false);
      } else {
        await api.post('/api/bookmarks', { storyId: story._id });
        setIsBookmarked(true);
      }
    } catch { /* ignore */ }
  };

  const fetchReviews = async (page: number) => {
    setLoadingReviews(true);
    try {
      const { data } = await api.get(`/api/stories/${story._id}/reviews`, { params: { page, limit: 10 } });
      setReviews(data.reviews || []);
      setPagination(data.pagination || pagination);
    } catch { console.error('Failed to load reviews'); }
    finally { setLoadingReviews(false); }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (userRating === 0) { setError('Please select a star rating first'); return; }
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      await api.post('/api/ratings', { storyId: story._id, ratingValue: userRating, reviewText });
      setSuccess('Your rating and review has been logged!');
      fetchReviews(reviewPage);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to submit rating.'); }
    finally { setIsSubmitting(false); }
  };

  const { ratingDistribution, totalReviewsCount } = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    reviews.forEach((rev) => { const idx = rev.ratingValue - 1; if (idx >= 0 && idx < 5) dist[idx]++; });
    return { ratingDistribution: dist, totalReviewsCount: pagination.total || reviews.length };
  }, [reviews, pagination.total]);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2, py: 5, minHeight: '90vh' }}>
      <Button component={Link} href="/" variant="text" startIcon={<ArrowBackIcon />} sx={{ mb: 3, color: 'text.secondary' }}>
        Back to Lobby
      </Button>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={4}>
        {/* Main Content */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Video */}
          <Paper sx={{ borderRadius: 2, overflow: 'hidden', mb: 3, aspectRatio: '16/9' }}>
            <iframe
              src={`https://www.youtube.com/embed/${story.youtubeId}`}
              title={story.title}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </Paper>

          {/* Meta */}
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip label={story.channel} size="small" color="primary" variant="outlined" />
            <Chip label={story.genre} size="small" variant="outlined" />
          </Stack>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, fontSize: { xs: '1.5rem', md: '2rem' } }}>{story.title}</Typography>

          <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', color: 'text.secondary', fontSize: '0.95rem', pb: 2, mb: 3, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <Typography>Narrator: <strong style={{ color: '#e2e8f0' }}>{story.narrator}</strong></Typography>
            {story.writer && <Typography>Writer: <strong style={{ color: '#e2e8f0' }}>{story.writer}</strong></Typography>}
            <Typography>
              Source: <a href={story.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#ff5e2b', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500, textDecoration: 'none' }}>
                <YoutubeIcon size={14} /> YouTube Link
              </a>
            </Typography>
          </Stack>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Synopsis</Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary', lineHeight: 1.7 }}>
              {story.description || 'No detailed description available. Check the YouTube link for more info.'}
            </Typography>
          </Box>

          {/* Reviews */}
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
              User Reviews ({pagination.total || reviews.length})
            </Typography>

            {loadingReviews ? (
              <AppLoadingState message="Loading reviews..." />
            ) : reviews.length === 0 ? (
              <AppEmptyState title="No reviews yet" message="Be the first to share your thoughts!" />
            ) : (
              <>
                <Stack spacing={2}>
                  {reviews.map((rev) => (
                    <Paper key={rev._id} sx={{ p: 2.5, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 12 }}>
                            {rev.userId.username[0].toUpperCase()}
                          </Avatar>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{rev.userId.username}</Typography>
                          <AppStarRating value={rev.ratingValue} readonly size={14} />
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarTodayIcon sx={{ fontSize: 12 }} />
                          {new Date(rev.updatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </Typography>
                      </Stack>
                      {rev.reviewText && <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>{rev.reviewText}</Typography>}
                    </Paper>
                  ))}
                </Stack>
                <AppPagination page={reviewPage} totalPages={pagination.totalPages} onChange={(p) => { setReviewPage(p); fetchReviews(p); }} showTotal={false} />
              </>
            )}
          </Box>
        </Box>

        {/* Sidebar */}
        <Stack spacing={3} sx={{ width: { lg: 340 }, flexShrink: 0 }}>
          {/* Bookmark Button */}
          {user && (
            <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {isBookmarked ? 'Bookmarked for later' : 'Save for later'}
                </Typography>
                <Tooltip title={isBookmarked ? 'Remove bookmark' : 'Bookmark this story'}>
                  <IconButton onClick={handleToggleBookmark} sx={{ color: isBookmarked ? 'primary.main' : 'text.secondary' }}>
                    {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Paper>
          )}

          {/* Rating Panel */}
          <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}>Community Rating</Typography>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
              <Typography variant="h2" sx={{ fontWeight: 800, color: '#f59e0b' }}>
                {story.averageRating > 0 ? story.averageRating.toFixed(1) : '0.0'}
              </Typography>
              <Box>
                <AppRatingDisplay rating={story.averageRating} count={story.ratingsCount} size={18} showCount={false} />
                <Typography variant="caption" color="text.secondary">Based on {story.ratingsCount} reviews</Typography>
              </Box>
            </Stack>
            <Stack spacing={1}>
              {ratingDistribution.slice().reverse().map((count, idx) => {
                const stars = 5 - idx;
                const pct = totalReviewsCount > 0 ? (count / totalReviewsCount) * 100 : 0;
                return (
                  <Stack key={stars} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ width: 12, textAlign: 'right', color: 'text.secondary' }}>{stars}</Typography>
                    <LinearProgress variant="determinate" value={pct} sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.06)', '& .MuiLinearProgress-bar': { bgcolor: '#f59e0b', borderRadius: 3 } }} />
                    <Typography variant="caption" color="text.secondary" sx={{ width: 20 }}>{count}</Typography>
                  </Stack>
                );
              })}
            </Stack>
          </Paper>

          {/* Rating Form */}
          <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid rgba(99,102,241,0.2)' }}>
            {user ? (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Your Journal Entry</Typography>
                {error && <AppAlert severity="error" message={error} onClose={() => setError('')} />}
                {success && <AppAlert severity="success" message={success} onClose={() => setSuccess('')} />}
                <form onSubmit={handleRatingSubmit}>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>How would you rate this story?</Typography>
                    <AppStarRating value={userRating} onChange={setUserRating} size={32} showLabel />
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Share your thoughts on the narration, music, sound design..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                  <Button type="submit" variant="contained" fullWidth size="large" startIcon={<SendIcon />} disabled={isSubmitting}>
                    {isSubmitting ? 'Logging review...' : 'Submit Rating'}
                  </Button>
                </form>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Have you listened to this?</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Log in to rate and review this audio story.
                </Typography>
                <Button component={Link} href="/login" variant="contained" fullWidth>Log In to Rate</Button>
              </Box>
            )}
          </Paper>
        </Stack>
      </Stack>
    </Box>
  );
}
