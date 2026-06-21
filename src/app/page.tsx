'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Star, MessageSquare, SlidersHorizontal, Eye, PlusCircle, Sparkles } from 'lucide-react';

interface Story {
  _id: string;
  title: string;
  channel: string;
  narrator: string;
  genre: string;
  youtubeId: string;
  thumbnailUrl: string;
  averageRating: number;
  ratingsCount: number;
  description?: string;
}

export default function HomePage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState('All');
  const [genre, setGenre] = useState('All');
  const [sortBy, setSortBy] = useState('rating'); // rating, reviews, newest

  // For debounce/delay search queries
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    // Log daily visit
    fetch('/api/stats/visit', { method: 'POST' }).catch((e) =>
      console.error('Failed to log visit stats:', e)
    );
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search: debouncedSearch,
        channel,
        genre,
        sortBy,
      });

      const res = await fetch(`/api/stories?${queryParams.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setStories(data.stories || []);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [debouncedSearch, channel, genre, sortBy]);

  const featuredStory = stories.length > 0 ? stories[0] : null;

  const channelsList = [
    'All',
    'Sunday Suspense',
    'Goppo Mirer Thek',
    'Midnight Horror Station',
    'Kahon',
    'Other Bengali Channels',
  ];

  const genresList = [
    'All',
    'Horror',
    'Mystery',
    'Thriller',
    'Drama',
    'Comedy',
    'Classic',
    'Adventure',
  ];

  const renderStars = (rating: number) => {
    const stars = [];
    const floor = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= floor) {
        stars.push(<Star key={i} size={13} fill="var(--gold)" color="var(--gold)" />);
      } else if (i === floor + 1 && hasHalf) {
        stars.push(
          <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
            <Star size={13} color="var(--text-muted)" />
            <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', overflow: 'hidden' }}>
              <Star size={13} fill="var(--gold)" color="var(--gold)" />
            </div>
          </div>
        );
      } else {
        stars.push(<Star key={i} size={13} className="star-empty" color="var(--text-muted)" />);
      }
    }
    return stars;
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          {featuredStory ? (
            <div className="hero-layout">
              <div>
                <div className="hero-subtitle">
                  <Sparkles size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Spotlight Story
                </div>
                <h1 className="hero-title">{featuredStory.title}</h1>
                <p className="hero-desc">
                  Narrated by <strong style={{ color: 'var(--text-primary)' }}>{featuredStory.narrator}</strong> on channel{' '}
                  <span style={{ color: 'var(--accent)', fontWeight: '600' }}>{featuredStory.channel}</span>.
                  {featuredStory.description && ` ${featuredStory.description.slice(0, 180)}...`}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="stars-display" style={{ fontSize: '1.2rem', gap: '4px' }}>
                      {renderStars(featuredStory.averageRating)}
                    </div>
                    <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                      {featuredStory.averageRating}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      ({featuredStory.ratingsCount} reviews)
                    </span>
                  </div>
                  <span className="badge badge-genre">{featuredStory.genre}</span>
                </div>
                <Link href={`/story/${featuredStory._id}`} className="btn btn-primary">
                  <Eye size={18} />
                  Listen & Review
                </Link>
              </div>

              <div className="hero-featured-card">
                <img
                  className="hero-featured-img"
                  src={featuredStory.thumbnailUrl || `https://img.youtube.com/vi/${featuredStory.youtubeId}/maxresdefault.jpg`}
                  alt={featuredStory.title}
                />
                <div className="hero-featured-overlay">
                  <div className="badge badge-genre" style={{ alignSelf: 'flex-start', marginBottom: '8px' }}>
                    {featuredStory.genre}
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>{featuredStory.title}</h3>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div className="hero-subtitle">Welcome to Bengaliboxd</div>
              <h1 className="hero-title" style={{ fontSize: '2.8rem' }}>The Bengali Audio Story Journal</h1>
              <p className="hero-desc" style={{ margin: '0 auto 24px auto' }}>
                A community-driven platform to search, rate, and review Bengali audio stories from Sunday Suspense, Goppo Mirer Thek, Midnight Horror Station, and others.
              </p>
              <Link href="/admin" className="btn btn-primary">
                <PlusCircle size={18} />
                Add Your First Story
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Main Content Area */}
      <section style={{ paddingBottom: '80px' }}>
        <div className="container">
          {/* Search, Filter, Sort Controls */}
          <div className="filters-bar">
            {/* Search Box */}
            <div className="search-box">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                className="form-input search-input"
                placeholder="Search by story title, narrator, or channel..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Select options */}
            <div className="filter-options">
              {/* Genre Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={14} style={{ color: 'var(--text-secondary)' }} />
                <select
                  className="form-input form-select"
                  style={{ width: '130px', padding: '8px 12px', fontSize: '0.85rem' }}
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                >
                  <option disabled>Genre</option>
                  {genresList.map((g) => (
                    <option key={g} value={g}>
                      {g === 'All' ? 'All Genres' : g}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sorting Filter */}
              <select
                className="form-input form-select"
                style={{ width: '150px', padding: '8px 12px', fontSize: '0.85rem' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="rating">Highest Rated</option>
                <option value="reviews">Most Reviewed</option>
                <option value="newest">Newest Added</option>
              </select>
            </div>
          </div>

          {/* Channel Tabs */}
          <div className="tabs">
            {channelsList.map((ch) => (
              <button
                key={ch}
                onClick={() => setChannel(ch)}
                className={`tab-btn ${channel === ch ? 'active' : ''}`}
                style={{ fontSize: '0.85rem', padding: '8px 12px' }}
              >
                {ch === 'All' ? 'All Channels' : ch}
              </button>
            ))}
          </div>

          {/* Stories Listing */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Loading catalog...</p>
            </div>
          ) : stories.length === 0 ? (
            <div 
              style={{ 
                textAlign: 'center', 
                padding: '60px 20px', 
                background: 'var(--bg-secondary)', 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-md)' 
              }}
            >
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No audio stories match your criteria</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
                Try adjusting your search query, selecting different channel tabs, or add a new story!
              </p>
              <Link href="/admin" className="btn btn-secondary">
                <PlusCircle size={16} /> Add Story
              </Link>
            </div>
          ) : (
            <div className="grid-cols stories-grid">
              {stories.map((st) => (
                <Link href={`/story/${st._id}`} key={st._id}>
                  <div className="story-card">
                    <div className="story-card-img-container">
                      <img
                        className="story-card-img"
                        src={st.thumbnailUrl || `https://img.youtube.com/vi/${st.youtubeId}/hqdefault.jpg`}
                        alt=""
                        loading="lazy"
                      />
                    </div>
                    <div className="story-card-content">
                      <div className="story-card-channel">{st.channel}</div>
                      <h3 className="story-card-title">{st.title}</h3>
                      <div className="story-card-footer">
                        <div className="story-card-narrator">{st.narrator}</div>
                        <div className="story-card-rating">
                          <Star size={12} fill="var(--gold)" color="var(--gold)" />
                          <span>{st.averageRating > 0 ? st.averageRating.toFixed(1) : '-'}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                            <MessageSquare size={10} style={{ marginLeft: '4px', marginRight: '2px' }} />
                            {st.ratingsCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
