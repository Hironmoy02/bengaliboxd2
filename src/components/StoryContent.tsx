'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useAppSelector } from '@/lib/hooks';
import api from '@/lib/axios';
import {
  Box, Typography, Button, Paper, Stack, Chip, TextField, Avatar, LinearProgress, IconButton, Tooltip, Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import StarIcon from '@mui/icons-material/Star';
import { AppPagination, AppAlert, AppStarRating, AppRatingDisplay, AppLoadingState, AppEmptyState } from '@/components/ui';
import { formatDuration } from '@/lib/constants';

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
  duration?: number;
  tags?: string[];
}

interface ReviewUser { _id: string; username: string; }
interface Review { _id: string; userId: ReviewUser; ratingValue: number; narrationRating?: number; atmosphereRating?: number; reviewText: string; updatedAt: string; }
interface Pagination { page: number; limit: number; total: number; totalPages: number; }

interface StoryContentProps {
  initialStory: Story;
  initialReviews: Review[];
  initialPagination: Pagination;
}

export default function StoryContent({ initialStory, initialReviews, initialPagination }: StoryContentProps) {
  const { user } = useAppSelector((s) => s.auth);
  const [story, setStory] = useState<Story>(initialStory);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [reviewPage, setReviewPage] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const existingReview = useMemo(() => {
    if (!user) return null;
    return reviews.find((rev) => rev.userId._id === user.id) || null;
  }, [user, reviews]);

  const [userRating, setUserRating] = useState<number>(() => existingReview?.ratingValue ?? 0);
  const [narrationRating, setNarrationRating] = useState<number>(() => existingReview?.narrationRating ?? 0);
  const [atmosphereRating, setAtmosphereRating] = useState<number>(() => existingReview?.atmosphereRating ?? 0);
  const [reviewText, setReviewText] = useState(() => existingReview?.reviewText ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isListened, setIsListened] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (user) {
      api.get('/api/bookmarks/check', { params: { storyId: story._id } })
        .then(({ data }) => setIsBookmarked(data.bookmarked))
        .catch(() => {});
      api.get('/api/listens/check', { params: { storyId: story._id } })
        .then(({ data }) => setIsListened(data.listened))
        .catch(() => {});
      api.get('/api/likes/check', { params: { storyId: story._id } })
        .then(({ data }) => setIsLiked(data.liked))
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

  const handleToggleListened = async () => {
    if (!user) return;
    try {
      if (isListened) {
        await api.delete('/api/listens', { data: { storyId: story._id } });
        setIsListened(false);
      } else {
        await api.post('/api/listens', { storyId: story._id });
        setIsListened(true);
      }
    } catch { /* ignore */ }
  };

  const handleToggleLike = async () => {
    if (!user) return;
    try {
      if (isLiked) {
        await api.delete('/api/likes', { data: { storyId: story._id } });
        setIsLiked(false);
      } else {
        await api.post('/api/likes', { storyId: story._id });
        setIsLiked(true);
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
      const { data } = await api.post('/api/ratings', { storyId: story._id, ratingValue: userRating, reviewText, narrationRating: narrationRating || undefined, atmosphereRating: atmosphereRating || undefined });
      setSuccess('Your rating and review has been logged!');
      
      // Update story state with new stats
      setStory((prev) => ({
        ...prev,
        averageRating: data.stats.averageRating,
        ratingsCount: data.stats.ratingsCount,
      }));

      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);

      fetchReviews(reviewPage);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to submit rating.'); }
    finally { setIsSubmitting(false); }
  };

  const { ratingDistribution, totalReviewsCount } = useMemo(() => {
    const dist = Array(10).fill(0);
    reviews.forEach((rev) => {
      const idx = Math.round(rev.ratingValue * 2) - 1;
      if (idx >= 0 && idx < 10) dist[idx]++;
    });
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

          <Stack direction="row" spacing={3} sx={{ flexWrap: 'wrap', color: 'text.secondary', fontSize: '0.95rem', pb: 2, mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography>Narrator: <strong style={{ color: '#e2e8f0' }}>{story.narrator}</strong></Typography>
            {story.writer && <Typography>Writer: <strong style={{ color: '#e2e8f0' }}>{story.writer}</strong></Typography>}
            {story.duration && <Typography>Duration: <strong style={{ color: '#e2e8f0' }}>{formatDuration(story.duration)}</strong></Typography>}
            <Typography>
              Source: <a href={story.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#ff5e2b', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500, textDecoration: 'none' }}>
                <YoutubeIcon size={14} /> YouTube Link
              </a>
            </Typography>
          </Stack>

          {story.tags && story.tags.length > 0 && (
            <Stack direction="row" spacing={0.5} sx={{ mb: 3, flexWrap: 'wrap', gap: 0.5 }}>
              {story.tags.map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ borderColor: 'divider' }} />
              ))}
            </Stack>
          )}

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
                    <Paper key={rev._id} sx={{ p: 2.5, background: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
                      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 12 }}>
                            {rev.userId.username[0].toUpperCase()}
                          </Avatar>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{rev.userId.username}</Typography>
                          <AppStarRating value={rev.ratingValue} readonly size={14} />
                          {rev.narrationRating && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                              Narr: {rev.narrationRating}
                            </Typography>
                          )}
                          {rev.atmosphereRating && (
                            <Typography variant="caption" color="text.secondary">
                              Atmo: {rev.atmosphereRating}
                            </Typography>
                          )}
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
          {/* Actions Panel */}
          {user && (
            <Paper sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-around', alignItems: 'center' }}>
                {/* Listened Button */}
                <Stack direction="column" sx={{ alignItems: 'center', flex: 1 }}>
                  <Tooltip title={isListened ? 'Remove from listened' : 'Mark as listened'}>
                    <IconButton onClick={handleToggleListened} sx={{ color: isListened ? '#22c55e' : 'text.secondary', p: 1.5 }}>
                      {isListened ? <CheckCircleIcon sx={{ fontSize: 28 }} /> : <HeadphonesIcon sx={{ fontSize: 28 }} />}
                    </IconButton>
                  </Tooltip>
                  <Typography variant="caption" color={isListened ? 'success.main' : 'text.secondary'} sx={{ fontWeight: 600 }}>
                    {isListened ? 'Listened' : 'Listen'}
                  </Typography>
                </Stack>

                <Divider orientation="vertical" flexItem />

                {/* Like Button */}
                <Stack direction="column" sx={{ alignItems: 'center', flex: 1 }}>
                  <Tooltip title={isLiked ? 'Unlike this story' : 'Like this story'}>
                    <IconButton onClick={handleToggleLike} sx={{ color: isLiked ? '#ef4444' : 'text.secondary', p: 1.5 }}>
                      {isLiked ? <FavoriteIcon sx={{ fontSize: 28 }} /> : <FavoriteBorderIcon sx={{ fontSize: 28 }} />}
                    </IconButton>
                  </Tooltip>
                  <Typography variant="caption" color={isLiked ? '#ef4444' : 'text.secondary'} sx={{ fontWeight: 600 }}>
                    {isLiked ? 'Liked' : 'Like'}
                  </Typography>
                </Stack>

                <Divider orientation="vertical" flexItem />

                {/* Bookmark Button */}
                <Stack direction="column" sx={{ alignItems: 'center', flex: 1 }}>
                  <Tooltip title={isBookmarked ? 'Remove bookmark' : 'Bookmark this story'}>
                    <IconButton onClick={handleToggleBookmark} sx={{ color: isBookmarked ? '#3b82f6' : 'text.secondary', p: 1.5 }}>
                      {isBookmarked ? <BookmarkIcon sx={{ fontSize: 28 }} /> : <BookmarkBorderIcon sx={{ fontSize: 28 }} />}
                    </IconButton>
                  </Tooltip>
                  <Typography variant="caption" color={isBookmarked ? '#3b82f6' : 'text.secondary'} sx={{ fontWeight: 600 }}>
                    {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          )}

          {/* Rating Panel */}
          <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
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
            
            {/* 10-bar Rating Distribution Vertical Histogram */}
            <Box sx={{ mt: 2, mb: 1 }}>
              <Stack direction="row" spacing={0.75} sx={{ height: 80, alignItems: 'flex-end', justifyContent: 'space-between', mb: 1, px: 0.5 }}>
                {ratingDistribution.map((count, idx) => {
                  const ratingVal = (idx + 1) / 2;
                  const maxCount = Math.max(...ratingDistribution, 1);
                  const heightPct = (count / maxCount) * 100;
                  return (
                    <Tooltip key={ratingVal} title={`${ratingVal} Star${ratingVal !== 1 ? 's' : ''}`} arrow>
                      <Box
                        sx={{
                          flex: 1,
                          height: `${Math.max(heightPct, 4)}%`, // at least 4% height so it is slightly visible even if 0 reviews
                          bgcolor: count > 0 ? '#22c55e' : 'action.hover', // green bar if there is rating, else light grey
                          borderRadius: '2px 2px 0 0',
                          transition: 'height 0.3s ease, background-color 0.3s ease',
                          '&:hover': {
                            bgcolor: '#16a34a',
                          }
                        }}
                      />
                    </Tooltip>
                  );
                })}
              </Stack>
              <Divider sx={{ mb: 1 }} />
              <Stack direction="row" sx={{ justifyContent: 'space-between', px: 0.5 }}>
                <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center' }}>
                  <StarIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">0.5</Typography>
                </Stack>
                <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">5.0</Typography>
                  <Stack direction="row" spacing={0.05}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <StarIcon key={i} sx={{ fontSize: 10, color: 'text.secondary' }} />
                    ))}
                  </Stack>
                </Stack>
              </Stack>
            </Box>
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
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Narration</Typography>
                      <AppStarRating value={narrationRating} onChange={setNarrationRating} size={22} showLabel />
                    </Box>
                    <Box sx={{ textAlign: 'center', flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Atmosphere</Typography>
                      <AppStarRating value={atmosphereRating} onChange={setAtmosphereRating} size={22} showLabel />
                    </Box>
                  </Stack>
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
