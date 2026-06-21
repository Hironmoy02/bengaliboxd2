'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Plus, AlertCircle, CheckCircle, RefreshCw, FileText, 
  UserCheck, Radio, Users, BarChart2, CheckSquare, Trash2, 
  Shield, Search, ExternalLink 
} from 'lucide-react';

interface Story {
  _id: string;
  title: string;
  channel: string;
  narrator: string;
  genre: string;
  youtubeId: string;
  youtubeUrl: string;
  approved: boolean;
}

interface UserProfile {
  _id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

interface TrafficStat {
  date: string;
  visitors: number;
}

interface AdminStats {
  totalUsers: number;
  adminUsers: number;
  approvedStories: number;
  pendingStories: number;
  totalReviews: number;
}

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

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Active Admin Tab (analytics, approvals, users, add)
  const [activeTab, setActiveTab] = useState('analytics');

  // Form states
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState('Sunday Suspense');
  const [narrator, setNarrator] = useState('');
  const [genre, setGenre] = useState('Horror');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  // UI Status states
  const [isFetchingYoutube, setIsFetchingYoutube] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Admin Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [traffic, setTraffic] = useState<TrafficStat[]>([]);
  const [pendingStories, setPendingStories] = useState<Story[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Fetch status indicators
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Channels list for dropdown
  const channelsList = [
    'Sunday Suspense',
    'Goppo Mirer Thek',
    'Midnight Horror Station',
    'Kahon',
    'Other Bengali Channels',
  ];

  // Genres list for dropdown
  const genresList = ['Horror', 'Mystery', 'Thriller', 'Drama', 'Comedy', 'Classic', 'Adventure'];

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch functions for admins
  const fetchStats = async () => {
    if (!user || user.role !== 'admin') return;
    setLoadingStats(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (res.ok) {
        setStats(data.metrics);
        setTraffic(data.traffic || []);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchPendingStories = async () => {
    if (!user || user.role !== 'admin') return;
    setLoadingPending(true);
    try {
      const res = await fetch('/api/stories?status=pending');
      const data = await res.json();
      if (res.ok) {
        setPendingStories(data.stories || []);
      }
    } catch (err) {
      console.error('Failed to load pending stories:', err);
    } finally {
      setLoadingPending(false);
    }
  };

  const fetchUsers = async () => {
    if (!user || user.role !== 'admin') return;
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok) {
        setUsersList(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load appropriate data when tab changes
  useEffect(() => {
    if (user && user.role === 'admin') {
      if (activeTab === 'analytics') fetchStats();
      if (activeTab === 'approvals') fetchPendingStories();
      if (activeTab === 'users') fetchUsers();
    }
  }, [activeTab, user]);

  // If user is normal, default active tab to "add" (suggest story)
  useEffect(() => {
    if (user && user.role !== 'admin') {
      setActiveTab('add');
    }
  }, [user]);

  const handleFetchYoutube = async () => {
    if (!youtubeUrl) {
      setError('Please enter a YouTube video URL first');
      return;
    }

    setError('');
    setSuccess('');
    setIsFetchingYoutube(true);

    try {
      const res = await fetch(`/api/youtube-fetch?url=${encodeURIComponent(youtubeUrl)}`);
      const data = await res.json();

      if (res.ok) {
        setTitle(data.title);
        const fetchedChannel = data.channel.toLowerCase();
        let matchedChannel = 'Other Bengali Channels';
        
        if (fetchedChannel.includes('suspense') || fetchedChannel.includes('mirchi')) {
          matchedChannel = 'Sunday Suspense';
        } else if (fetchedChannel.includes('thek') || fetchedChannel.includes('mir afsar')) {
          matchedChannel = 'Goppo Mirer Thek';
        } else if (fetchedChannel.includes('midnight') || fetchedChannel.includes('station')) {
          matchedChannel = 'Midnight Horror Station';
        } else if (fetchedChannel.includes('kahon')) {
          matchedChannel = 'Kahon';
        }
        
        setChannel(matchedChannel);
        setDescription(data.description || '');
        setThumbnailUrl(data.thumbnailUrl || '');
        
        const lowerTitle = data.title.toLowerCase();
        if (lowerTitle.includes('somak')) setNarrator('Somak');
        else if (lowerTitle.includes('mir')) setNarrator('Mir');
        else if (lowerTitle.includes('deep')) setNarrator('Deep');
        else if (lowerTitle.includes('sayak')) setNarrator('Sayak');
        else if (lowerTitle.includes('jojo')) setNarrator('Jojo');
        else setNarrator('');

        setSuccess('Successfully fetched YouTube story details!');
      } else {
        setError(data.error || 'Failed to retrieve YouTube details.');
      }
    } catch (err) {
      setError('Failed to query YouTube API');
    } finally {
      setIsFetchingYoutube(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title || !channel || !youtubeUrl || !narrator) {
      setError('Please fill out all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          channel,
          youtubeUrl,
          narrator,
          genre,
          description,
          thumbnailUrl,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || 'Story added successfully!');
        setYoutubeUrl('');
        setTitle('');
        setNarrator('');
        setDescription('');
        setThumbnailUrl('');
        if (user?.role === 'admin') {
          fetchStats(); // Update stats
        }
      } else {
        setError(data.error || 'Failed to save story to database.');
      }
    } catch (err) {
      setError('An unexpected error occurred saving the story.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveStory = async (storyId: string) => {
    setError('');
    setSuccess('');
    setActionInProgress(storyId);
    try {
      const res = await fetch(`/api/stories/${storyId}/approve`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        fetchPendingStories();
      } else {
        setError(data.error || 'Failed to approve story');
      }
    } catch (err) {
      setError('Failed to approve story');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRejectStory = async (storyId: string) => {
    if (!window.confirm('Are you sure you want to reject and delete this story suggestion?')) {
      return;
    }
    setError('');
    setSuccess('');
    setActionInProgress(storyId);
    try {
      const res = await fetch(`/api/stories/${storyId}/approve`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        fetchPendingStories();
      } else {
        setError(data.error || 'Failed to delete story');
      }
    } catch (err) {
      setError('Failed to delete story');
    } finally {
      setActionInProgress(null);
    }
  };

  const handlePromoteUser = async (targetUserId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to promote '${username}' to Admin?`)) {
      return;
    }
    setError('');
    setSuccess('');
    setActionInProgress(targetUserId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message);
        fetchUsers();
      } else {
        setError(data.error || 'Failed to promote user');
      }
    } catch (err) {
      setError('Failed to promote user');
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading || !user) {
    return (
      <div className="container flex-center" style={{ minHeight: '60vh' }}>
        <p>Loading Contributor panel...</p>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="container" style={{ padding: '40px 20px', minHeight: '80vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>
          {isAdmin ? 'Admin Console' : 'Contributor Desk'}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {isAdmin 
            ? 'Manage audio stories database, review user suggestions, promote admins, and view analytics.' 
            : 'Suggest and submit audio stories from YouTube to help keep the catalog up to date!'}
        </p>
      </div>

      {/* Admin Tab Header buttons */}
      {isAdmin && (
        <div className="tabs" style={{ marginBottom: '32px' }}>
          <button 
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart2 size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Analytics
          </button>
          <button 
            className={`tab-btn ${activeTab === 'approvals' ? 'active' : ''}`}
            onClick={() => setActiveTab('approvals')}
          >
            <CheckSquare size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Pending Approvals ({stats?.pendingStories ?? 0})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Users Management
          </button>
          <button 
            className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => setActiveTab('add')}
          >
            <Plus size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
            Add Audio Story
          </button>
        </div>
      )}

      {/* Main Alerts */}
      {error && (
        <div 
          style={{ 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid var(--danger)', 
            color: 'var(--danger)',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '24px',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div 
          style={{ 
            background: 'rgba(16, 185, 129, 0.1)', 
            border: '1px solid var(--success)', 
            color: 'var(--success)',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '24px',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Tab Panels */}

      {/* 1. ANALYTICS TAB */}
      {isAdmin && activeTab === 'analytics' && (
        <div>
          {loadingStats ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading analytics stats...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div className="glass-card" style={{ textAlign: 'center', padding: '20px' }}>
                  <Users size={28} style={{ color: 'var(--accent)', marginBottom: '8px' }} />
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Active Users</h4>
                  <p style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '4px' }}>{stats?.totalUsers}</p>
                </div>
                <div className="glass-card" style={{ textAlign: 'center', padding: '20px' }}>
                  <Shield size={28} style={{ color: 'var(--success)', marginBottom: '8px' }} />
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Admins</h4>
                  <p style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '4px' }}>{stats?.adminUsers}</p>
                </div>
                <div className="glass-card" style={{ textAlign: 'center', padding: '20px' }}>
                  <FileText size={28} style={{ color: 'var(--gold)', marginBottom: '8px' }} />
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Stories in Lobby</h4>
                  <p style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '4px' }}>{stats?.approvedStories}</p>
                </div>
                <div className="glass-card" style={{ textAlign: 'center', padding: '20px' }}>
                  <CheckSquare size={28} style={{ color: 'var(--danger)', marginBottom: '8px' }} />
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Pending Approvals</h4>
                  <p style={{ fontSize: '2.2rem', fontWeight: '800', marginTop: '4px' }}>{stats?.pendingStories}</p>
                </div>
              </div>

              {/* Traffic Trends */}
              <div className="glass-card">
                <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                  Traffic Analytics (Last 7 Days)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {traffic.map((day) => (
                    <div 
                      key={day.date} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '12px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <span style={{ fontWeight: '600' }}>{day.date}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div 
                          style={{ 
                            height: '10px', 
                            width: `${Math.min(day.visitors * 15, 200)}px`, 
                            background: 'var(--accent)', 
                            borderRadius: '2px' 
                          }} 
                        />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          <strong>{day.visitors}</strong> unique visits
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. PENDING APPROVALS TAB */}
      {isAdmin && activeTab === 'approvals' && (
        <div>
          {loadingPending ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading pending stories...</p>
          ) : pendingStories.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
              <CheckCircle size={32} style={{ color: 'var(--success)', marginBottom: '12px' }} />
              <h3>All clear!</h3>
              <p style={{ color: 'var(--text-muted)' }}>There are no pending story submissions waiting for approval.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {pendingStories.map((story) => (
                <div key={story._id} className="glass-card responsive-grid-approval-card">
                  <img 
                    src={`https://img.youtube.com/vi/${story.youtubeId}/hqdefault.jpg`}
                    alt="" 
                    style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                  />
                  <div>
                    <span className="badge badge-channel" style={{ color: 'var(--accent)', marginBottom: '6px', display: 'inline-block' }}>{story.channel}</span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '4px' }}>{story.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Narrator: <strong>{story.narrator}</strong> &bull; Genre: <strong>{story.genre}</strong>
                    </p>
                    <a 
                      href={story.youtubeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px' }}
                    >
                      <ExternalLink size={12} /> Play test on YouTube
                    </a>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleApproveStory(story._id)}
                      disabled={actionInProgress !== null}
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      {actionInProgress === story._id ? 'Working...' : 'Approve'}
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleRejectStory(story._id)}
                      disabled={actionInProgress !== null}
                      style={{ padding: '8px 16px', fontSize: '0.85rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                    >
                      <Trash2 size={14} style={{ verticalAlign: 'middle' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. USERS MANAGEMENT TAB */}
      {isAdmin && activeTab === 'users' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Registered Users Directory</h3>
            <div className="search-box" style={{ maxWidth: '280px' }}>
              <Search className="search-icon" size={14} />
              <input 
                type="text" 
                className="form-input search-input" 
                placeholder="Search username/email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ padding: '8px 12px 8px 36px', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {loadingUsers ? (
            <p style={{ color: 'var(--text-muted)' }}>Loading users list...</p>
          ) : filteredUsers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No users found matching query.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px' }}>Username</th>
                    <th style={{ padding: '12px' }} className="hide-mobile">Email</th>
                    <th style={{ padding: '12px' }}>Role</th>
                    <th style={{ padding: '12px' }} className="hide-mobile">Joined Date</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{u.username}</td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }} className="hide-mobile">{u.email}</td>
                      <td style={{ padding: '12px' }}>
                        <span 
                          className="badge" 
                          style={{ 
                            background: u.role === 'admin' ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-tertiary)',
                            color: u.role === 'admin' ? 'var(--success)' : 'var(--text-secondary)',
                            border: u.role === 'admin' ? '1px solid var(--success)' : '1px solid var(--border-color)',
                          }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.85rem' }} className="hide-mobile">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {u.role !== 'admin' && (
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => handlePromoteUser(u._id, u.username)}
                            disabled={actionInProgress !== null}
                            style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'var(--success)', color: 'var(--success)' }}
                          >
                            <UserCheck size={12} style={{ marginRight: '4px' }} />
                            Make Admin
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'add' && (
        <div className={isAdmin ? "responsive-grid-admin" : ""}>
          {/* Form panel */}
          <div className="glass-card">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Plus size={20} style={{ color: 'var(--accent)' }} /> 
              {isAdmin ? 'Add New Audio Story' : 'Suggest an Audio Story'}
            </h2>

            {!isAdmin && (
              <div 
                style={{ 
                  background: 'rgba(255, 94, 43, 0.05)', 
                  border: '1px solid var(--accent-glow)', 
                  padding: '16px', 
                  borderRadius: 'var(--radius-md)', 
                  marginBottom: '24px',
                  fontSize: '0.9rem'
                }}
              >
                <p>
                  <strong>Note:</strong> Since you are registered as a normal user, your story suggestion will be saved in the database as pending and will be reviewed by an admin. It will appear publicly on the lobby as soon as it is approved!
                </p>
              </div>
            )}

            <div 
              className="form-group" 
              style={{ 
                background: 'var(--bg-primary)', 
                padding: '16px', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--border-color)',
                marginBottom: '28px'
              }}
            >
              <label className="form-label" style={{ fontWeight: '600' }}>
                <YoutubeIcon size={16} color="var(--danger)" style={{ marginRight: '6px' }} />
                YouTube Video Link
              </label>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                />
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleFetchYoutube}
                  disabled={isFetchingYoutube}
                >
                  {isFetchingYoutube ? (
                    <>
                      <RefreshCw size={16} className="spin-animation" />
                      Fetching...
                    </>
                  ) : (
                    'Fetch Details'
                  )}
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Paste the link and click 'Fetch Details' to automatically extract title, channel, description, and thumbnail!
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="title">
                  <FileText size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Story Title *
                </label>
                <input
                  type="text"
                  id="title"
                  className="form-input"
                  placeholder="e.g. Sunday Suspense | The Hound of the Baskervilles"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="responsive-grid-half">
                <div className="form-group">
                  <label className="form-label" htmlFor="channel">
                    <Radio size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                    YouTube Channel *
                  </label>
                  <select
                    id="channel"
                    className="form-input form-select"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    required
                  >
                    {channelsList.map((ch) => (
                      <option key={ch} value={ch}>
                        {ch}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="genre">Genre *</label>
                  <select
                    id="genre"
                    className="form-input form-select"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    required
                  >
                    {genresList.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="narrator">
                  <UserCheck size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
                  Narrator(s) *
                </label>
                <input
                  type="text"
                  id="narrator"
                  className="form-input"
                  placeholder="e.g. Somak, Mir, Deep, Sabyasachi"
                  value={narrator}
                  onChange={(e) => setNarrator(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">Description</label>
                <textarea
                  id="description"
                  className="form-input"
                  placeholder="Optional story synopsis or details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '32px' }}>
                <label className="form-label" htmlFor="thumbnailUrl">Thumbnail URL</label>
                <input
                  type="text"
                  id="thumbnailUrl"
                  className="form-input"
                  placeholder="Autofilled if YouTube link fetched"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '14px' }}
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? 'Saving submission...' 
                  : isAdmin 
                    ? 'Add Story to Database' 
                    : 'Submit Story Suggestion'}
              </button>
            </form>
          </div>

          {/* Quick Info Sidebar (Admin only) */}
          {isAdmin && (
            <div>
              <div className="glass-card" style={{ padding: '20px', background: 'radial-gradient(circle at center, var(--accent-glow) 0%, transparent 100%)' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Duplicate Checks</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  Bengaliboxd automatically extracts the 11-character YouTube video ID and cross-checks it with the database. 
                  This ensures that **no duplicate entries** of the same audio story can be added, even if the title or spelling varies.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Spin Animation Keyframes */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
