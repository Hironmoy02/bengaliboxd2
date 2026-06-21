'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Star, MessageSquare, Calendar, ChevronLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';

const YoutubeIcon = ({ size = 16, color = 'currentColor', ...props }: { size?: number; color?: string; [key: string]: any }) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill={color}
    style={{ display: 'inline-block', verticalAlign: 'middle', ...props.style }}
    {...props}
  >
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
  youtubeId: string;
  thumbnailUrl: string;
  averageRating: number;
  ratingsCount: number;
  description?: string;
}


interface Review {
  _id: string;
  userId: {
    _id: string;
    username: string;
  };
  ratingValue: number;
  reviewText: string;
  updatedAt: string;
}

export default function StoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const storyId = resolvedParams.id;

  const { user } = useAuth();

  // Data states
  const [story, setStory] = useState<Story | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Review editor states
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchStoryDetails = async () => {
    try {
      // Fetch story
      const storyRes = await fetch(`/api/stories/${storyId}`);
      const storyData = await storyRes.json();
      if (storyRes.ok) {
        setStory(storyData.story);
      }

      // Fetch reviews
      const reviewsRes = await fetch(`/api/stories/${storyId}/reviews`);
      const reviewsData = await reviewsRes.json();
      if (reviewsRes.ok) {
        setReviews(reviewsData.reviews || []);
        
        // If logged in, find if this user has already left a review
        if (user) {
          const existingReview = reviewsData.reviews.find(
            (rev: Review) => rev.userId._id === user.id
          );
          if (existingReview) {
            setUserRating(existingReview.ratingValue);
            setReviewText(existingReview.reviewText || '');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load story details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoryDetails();
  }, [storyId, user]);

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (userRating === 0) {
      setError('Please select a star rating first');
      return;
    }

    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyId,
          ratingValue: userRating,
          reviewText,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Your rating and review has been logged!');
        // Refresh detail ratings & counts
        fetchStoryDetails();
      } else {
        setError(data.error || 'Failed to submit rating.');
      }
    } catch (err) {
      setError('An error occurred submitting your review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate rating stats
  const ratingDistribution = [0, 0, 0, 0, 0]; // 1, 2, 3, 4, 5 stars
  reviews.forEach((rev) => {
    const index = rev.ratingValue - 1;
    if (index >= 0 && index < 5) {
      ratingDistribution[index]++;
    }
  });

  const totalReviewsCount = reviews.length;

  const renderStars = (rating: number, size = 14) => {
    const stars = [];
    const floor = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= floor) {
        stars.push(<Star key={i} size={size} fill="var(--gold)" color="var(--gold)" />);
      } else if (i === floor + 1 && hasHalf) {
        stars.push(
          <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
            <Star size={size} color="var(--text-muted)" />
            <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', overflow: 'hidden' }}>
              <Star size={size} fill="var(--gold)" color="var(--gold)" />
            </div>
          </div>
        );
      } else {
        stars.push(<Star key={i} size={size} className="star-empty" color="var(--text-muted)" />);
      }
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="container flex-center" style={{ minHeight: '60vh' }}>
        <p>Loading audio story details...</p>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="container flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
        <AlertCircle size={40} style={{ color: 'var(--danger)' }} />
        <h2>Story not found</h2>
        <Link href="/" className="btn btn-secondary">
          <ChevronLeft size={16} /> Back to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px', minHeight: '90vh' }}>
      {/* Breadcrumb / Back button */}
      <div style={{ marginBottom: '24px' }}>
        <Link 
          href="/" 
          className="btn btn-secondary" 
          style={{ display: 'inline-flex', padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <ChevronLeft size={14} />
          Back to Lobby
        </Link>
      </div>

      {/* Main Grid: Player on left, Stats & Input on right */}
      <div className="detail-layout">
        {/* Left Column: Player & Meta */}
        <div>
          {/* YouTube Embed Player */}
          <div className="video-container">
            <iframe
              src={`https://www.youtube.com/embed/${story.youtubeId}`}
              title={story.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <span className="badge badge-channel" style={{ color: 'var(--accent)' }}>{story.channel}</span>
              <span className="badge badge-genre">{story.genre}</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', marginBottom: '16px' }}>{story.title}</h1>
            
            <div style={{ display: 'flex', gap: '20px', color: 'var(--text-secondary)', fontSize: '0.95rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '20px' }}>
              <div>
                Narrator: <strong style={{ color: 'var(--text-primary)' }}>{story.narrator}</strong>
              </div>
              <div>
                Source:{' '}
                <a 
                  href={story.youtubeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}
                >
                  <YoutubeIcon size={14} /> YouTube Link
                </a>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Synopsis</h3>
              <p style={{ fontSize: '1rem', whiteSpace: 'pre-wrap' }}>
                {story.description || 'No detailed description available for this audio story. Use the YouTube link to check out the description on YouTube.'}
              </p>
            </div>
          </div>

          {/* Reviews List */}
          <div className="reviews-section">
            <div className="reviews-header">
              <h3 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={20} />
                User Reviews ({reviews.length})
              </h3>
            </div>

            {reviews.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ color: 'var(--text-muted)' }}>No reviews yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {reviews.map((rev) => (
                  <div className="review-item" key={rev._id}>
                    <div className="review-meta">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="review-author">{rev.userId.username}</span>
                        <div style={{ display: 'flex' }}>
                          {renderStars(rev.ratingValue, 12)}
                        </div>
                      </div>
                      <span className="review-date">
                        <Calendar size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        {new Date(rev.updatedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    {rev.reviewText && <p className="review-text">{rev.reviewText}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Rating Panel & Star Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Stats Box */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Community Rating</h3>
            <div className="rating-panel-header">
              <span className="rating-huge">
                {story.averageRating > 0 ? story.averageRating.toFixed(1) : '0.0'}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="stars-display" style={{ fontSize: '1.1rem' }}>
                  {renderStars(story.averageRating, 16)}
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Based on {story.ratingsCount} reviews
                </span>
              </div>
            </div>

            {/* Distribution chart */}
            <div className="rating-bars">
              {ratingDistribution.slice().reverse().map((count, index) => {
                const starsCount = 5 - index;
                const percentage = totalReviewsCount > 0 ? (count / totalReviewsCount) * 100 : 0;
                return (
                  <div className="rating-bar-row" key={starsCount}>
                    <span className="rating-bar-label">{starsCount}</span>
                    <Star size={10} fill="var(--gold)" color="var(--gold)" />
                    <div className="rating-bar-bg">
                      <div className="rating-bar-fill" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="rating-bar-count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Review Input Box */}
          <div className="glass-card" style={{ border: '1px solid var(--border-focus)' }}>
            {user ? (
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Your Journal Entry</h3>
                
                {error && (
                  <div 
                    style={{ 
                      background: 'rgba(239, 68, 68, 0.1)', 
                      border: '1px solid var(--danger)', 
                      color: 'var(--danger)',
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '16px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <AlertCircle size={14} />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div 
                    style={{ 
                      background: 'rgba(16, 185, 129, 0.1)', 
                      border: '1px solid var(--success)', 
                      color: 'var(--success)',
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '16px',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <CheckCircle size={14} />
                    <span>{success}</span>
                  </div>
                )}

                <form onSubmit={handleRatingSubmit}>
                  {/* Clickable Star Selector */}
                  <div className="form-group" style={{ alignItems: 'center', margin: '20px 0' }}>
                    <label className="form-label" style={{ marginBottom: '8px' }}>
                      How would you rate this story?
                    </label>
                    <div className="star-rating-select">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = star <= (hoverRating || userRating);
                        return (
                          <button
                            key={star}
                            type="button"
                            className={`star-btn ${active ? 'active' : ''}`}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setUserRating(star)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            <Star 
                              size={32} 
                              fill={active ? 'var(--gold)' : 'none'} 
                              color={active ? 'var(--gold)' : 'var(--text-muted)'} 
                              style={{ transition: 'all 0.15s ease' }}
                            />
                          </button>
                        );
                      })}
                    </div>
                    {userRating > 0 && (
                      <span style={{ fontSize: '0.9rem', color: 'var(--gold)', fontWeight: '600', marginTop: '8px' }}>
                        {userRating} Star{userRating > 1 ? 's' : ''} Selected
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="review">Write a Review (Optional)</label>
                    <textarea
                      id="review"
                      className="form-input"
                      placeholder="Share your thoughts on the narration, music, sound design, and script adaptation..."
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      rows={5}
                      style={{ resize: 'vertical', fontSize: '0.9rem' }}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '12px' }}
                    disabled={isSubmitting}
                  >
                    <Send size={14} />
                    {isSubmitting ? 'Logging review...' : 'Submit Rating'}
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Star size={36} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Have you listened to this?</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Log in to rate and review this audio story on Bengaliboxd.
                </p>
                <Link href="/login" className="btn btn-primary" style={{ width: '100%' }}>
                  Log In to Rate
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
